import crypto from 'crypto';

/**
 * Safepay payment gateway service.
 *
 * Encapsulates every direct call to Safepay's HTTP API so the rest of the
 * codebase only deals with our own clean interfaces. Safepay's hosted
 * checkout flow (the only one that works in Expo without native modules)
 * looks like this:
 *
 *   1. Backend  -> POST /order/payments/v3/init      => returns a "tracker" token
 *   2. App      -> opens https://<env>.api.getsafepay.com/embedded/?tbt=<tracker>
 *   3. Safepay  -> redirects user to SAFEPAY_REDIRECT_URL on success
 *   4. Safepay  -> POSTs a webhook to our /payments/safepay/webhook endpoint
 *   5. Backend  -> verifies signature, marks the order as paid
 *
 * Docs: https://docs.getsafepay.com
 */

// ----- Types ---------------------------------------------------------------

export interface CreateTrackerInput {
  /** Order amount in major units (e.g. 250.00 for Rs. 250). */
  amount: number;
  /** ISO 4217 currency code, e.g. "PKR", "USD". */
  currency: string;
  /** Our internal order id — echoed back in the webhook so we can reconcile. */
  orderId: string;
  /** Free-form description shown on the Safepay checkout. */
  description?: string;
  /** Customer information shown on the checkout & receipt. */
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export interface CreateTrackerResult {
  /** Tracker token used to build the hosted-checkout URL. */
  tracker: string;
  /** Fully-built hosted-checkout URL the app should open in the browser. */
  checkoutUrl: string;
}

export interface SafepayWebhookPayload {
  /** Safepay event name, e.g. "payment.captured", "payment.failed". */
  event: string;
  /** Tracker token created in step 1. */
  tracker: string;
  /** Status of the underlying payment. */
  state: string;
  /** Our internal order id (echoed via metadata.order_id). */
  orderId?: string;
  /** Provider-side transaction reference. */
  transactionReference?: string;
  /** Raw payload for auditing / debugging. */
  raw: any;
}

// ----- Configuration -------------------------------------------------------

/**
 * Reads Safepay env vars at call time (not module load) so tests / scripts
 * that mutate process.env still work, and so we surface a clear error if a
 * required variable is missing.
 */
function getConfig() {
  const baseUrl = process.env.SAFEPAY_BASE_URL || 'https://sandbox.api.getsafepay.com';
  const apiKey = process.env.SAFEPAY_API_KEY;
  const secretKey = process.env.SAFEPAY_SECRET_KEY;
  const webhookSecret = process.env.SAFEPAY_WEBHOOK_SECRET;
  const environment = (process.env.SAFEPAY_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';
  const redirectUrl = process.env.SAFEPAY_REDIRECT_URL || 'foodie://payment/callback';
  const cancelUrl = process.env.SAFEPAY_CANCEL_URL || 'foodie://payment/cancel';

  if (!apiKey || !secretKey) {
    throw new Error(
      'Safepay is not configured: set SAFEPAY_API_KEY and SAFEPAY_SECRET_KEY in backend/.env',
    );
  }

  return { baseUrl, apiKey, secretKey, webhookSecret, environment, redirectUrl, cancelUrl };
}

// ----- HTTP helper ---------------------------------------------------------

/**
 * Thin wrapper around `fetch` that talks to Safepay using the standard
 * `Authorization: Bearer <api_key>` header pattern. Throws a descriptive
 * error if the API responds with anything outside the 2xx range.
 */
async function safepayRequest<T>(
  path: string,
  init: { method: 'GET' | 'POST'; body?: any },
): Promise<T> {
  const { baseUrl, apiKey } = getConfig();

  const response = await fetch(`${baseUrl}${path}`, {
    method: init.method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  // Try to parse JSON either way — Safepay returns structured error bodies.
  const text = await response.text();
  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }

  if (!response.ok) {
    const message =
      parsed?.message || parsed?.error || `Safepay request failed (HTTP ${response.status})`;
    throw new Error(message);
  }

  return parsed as T;
}

// ----- Public API ----------------------------------------------------------

/**
 * Creates a Safepay payment tracker for the given order. The returned
 * tracker token is then embedded into the hosted-checkout URL.
 *
 * Safepay expects amounts in the smallest currency unit (paisa for PKR,
 * cents for USD), so we multiply by 100 here.
 */
export async function createTracker(input: CreateTrackerInput): Promise<CreateTrackerResult> {
  const { baseUrl, environment, redirectUrl, cancelUrl } = getConfig();

  // Convert to minor units. Round to avoid floating-point drift like 49.99 * 100 = 4998.9999...
  const amountMinor = Math.round(input.amount * 100);

  const payload = {
    client: 'sdk',
    environment,
    intent: 'CYBERSOURCE',
    mode: 'payment',
    currency: input.currency,
    amount: amountMinor,
    // Safepay echoes `metadata` back in the webhook — we use it to reconcile.
    metadata: {
      order_id: input.orderId,
      source: 'foodie-mobile-app',
    },
    redirect_url: redirectUrl,
    cancel_url: cancelUrl,
    description: input.description,
    customer: input.customer
      ? {
          name: input.customer.name,
          email: input.customer.email,
          phone: input.customer.phone,
        }
      : undefined,
  };

  // Safepay's v3 init endpoint returns { data: { tracker: { token } } }.
  const result = await safepayRequest<{ data: { tracker: { token: string } } }>(
    '/order/payments/v3/init',
    { method: 'POST', body: payload },
  );

  const tracker = result?.data?.tracker?.token;
  if (!tracker) {
    throw new Error('Safepay did not return a tracker token');
  }

  // The hosted checkout page lives on the same host as the API.
  const checkoutUrl = `${baseUrl}/embedded/?tbt=${encodeURIComponent(tracker)}&env=${environment}`;

  return { tracker, checkoutUrl };
}

/**
 * Fetches the latest state of a payment. Used as a safety net in case the
 * webhook is delayed: when the user returns to the app after the redirect,
 * we can ask Safepay directly whether the payment cleared.
 */
export async function getPaymentStatus(tracker: string): Promise<{ state: string; raw: any }> {
  const result = await safepayRequest<{ data: { state: string } }>(
    `/order/v1/order/${encodeURIComponent(tracker)}`,
    { method: 'GET' },
  );
  return { state: result?.data?.state || 'UNKNOWN', raw: result };
}

/**
 * Verifies a Safepay webhook signature. Safepay signs the raw request body
 * with HMAC-SHA256 using the merchant's webhook secret and sends the
 * signature in the `x-sfpy-signature` header. We recompute and compare in
 * constant time to avoid timing leaks.
 *
 * IMPORTANT: pass the *raw* body (Buffer / string), NOT the JSON-parsed
 * object — re-serialising can change byte order and break the comparison.
 */
export function verifyWebhookSignature(rawBody: string | Buffer, signature: string | undefined): boolean {
  const { webhookSecret } = getConfig();

  // If no webhook secret is configured (e.g. local sandbox), skip verification
  // but log a warning so it's obvious in production logs.
  if (!webhookSecret) {
    console.warn('[Safepay] SAFEPAY_WEBHOOK_SECRET not set — skipping signature check');
    return true;
  }

  if (!signature) return false;

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'))
    .digest('hex');

  // Use timingSafeEqual to mitigate timing attacks. Lengths must match first.
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Normalises a Safepay webhook into a shape the controller can act on.
 */
export function parseWebhookPayload(body: any): SafepayWebhookPayload {
  return {
    event: body?.event || body?.type || 'unknown',
    tracker: body?.data?.tracker || body?.tracker || '',
    state: body?.data?.state || body?.state || 'UNKNOWN',
    orderId: body?.data?.metadata?.order_id || body?.metadata?.order_id,
    transactionReference: body?.data?.reference || body?.reference,
    raw: body,
  };
}
