import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { paymentAPI, SafepayVerifyResponse } from './api/payment.api';

/**
 * Frontend-side Safepay helper. Drives the hosted checkout flow without any
 * native-only modules:
 *
 *   1. Ask the backend to create a Safepay session for the order.
 *   2. Open the hosted checkout URL in `expo-web-browser`'s auth session,
 *      which automatically dismisses the in-app browser when our deep link
 *      (`foodie://payment/callback`) fires.
 *   3. Re-verify the payment with the backend (the webhook usually has
 *      already settled it, but we double-check in case of network delays).
 *
 * The whole flow is resolved with a single call to `payWithSafepay()`.
 */

export type SafepayOutcome =
  | { kind: 'success'; status: 'Completed'; order: any }
  | { kind: 'pending'; status: 'Pending'; order?: any }
  | { kind: 'failed'; status: 'Failed'; reason?: string; order?: any }
  | { kind: 'cancelled' };

/**
 * Runs the full Safepay hosted-checkout flow for the given order id.
 * Resolves with a typed outcome — never throws for "user cancelled" or
 * "payment failed", only for actual programming / network errors.
 */
export async function payWithSafepay(orderId: string): Promise<SafepayOutcome> {
  // 1. Initiate — backend talks to Safepay and persists the tracker.
  const session = await paymentAPI.initiateSafepay(orderId);

  // The redirect URL must match what the backend sends to Safepay
  // (SAFEPAY_REDIRECT_URL in backend/.env). Building it here so the in-app
  // browser knows when to auto-dismiss.
  const redirectUrl = Linking.createURL('payment/callback');

  // 2. Open the hosted checkout. `openAuthSessionAsync` is the right primitive
  // here: it ties the in-app browser to a redirect URL and auto-closes when
  // it fires, instead of leaving the user stranded on a blank page.
  const result = await WebBrowser.openAuthSessionAsync(session.checkoutUrl, redirectUrl, {
    showInRecents: false,
  });

  // The browser dismissal can be 'dismiss' (user closed it manually),
  // 'cancel' (Android system back), or 'success' (deep-link redirect fired).
  if (result.type === 'cancel' || result.type === 'dismiss') {
    // Even if the user dismissed, the payment might still have succeeded
    // (e.g. they completed it and then closed the tab). Verify before giving up.
    try {
      const verified = await paymentAPI.verifySafepay(orderId);
      return mapOutcome(verified);
    } catch {
      return { kind: 'cancelled' };
    }
  }

  // 3. Verify the payment with the backend, which checks Safepay's status
  // endpoint as a fallback in case the webhook hasn't landed yet.
  const verified = await paymentAPI.verifySafepay(orderId);
  return mapOutcome(verified);
}

function mapOutcome(verified: SafepayVerifyResponse): SafepayOutcome {
  if (verified.status === 'Completed') {
    return { kind: 'success', status: 'Completed', order: verified.order };
  }
  if (verified.status === 'Failed') {
    return { kind: 'failed', status: 'Failed', reason: verified.state, order: verified.order };
  }
  return { kind: 'pending', status: 'Pending', order: verified.order };
}
