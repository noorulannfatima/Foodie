import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './baseUrl';

/**
 * Payment API client.
 *
 * Mirrors `backend/src/routes/payment.routes.ts`. Two payment methods are
 * supported by the backend:
 *
 *   - Safepay (online card / wallet via hosted checkout)
 *   - Cash on Delivery
 *
 * The webhook endpoint (/payments/safepay/webhook) is server-to-server only
 * and is intentionally NOT exposed here.
 */

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(res: Response) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Payment request failed');
  return data;
}

// ----- Types ---------------------------------------------------------------

export interface SafepayInitiateResponse {
  /** Safepay tracker token for the session. */
  tracker: string;
  /** Hosted checkout URL — open this in expo-web-browser. */
  checkoutUrl: string;
  /** Echoed for convenience. */
  orderId: string;
  orderNumber: string;
}

export interface SafepayVerifyResponse {
  /** Mapped to our internal payment.status enum. */
  status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
  /** Raw Safepay state, e.g. "TRACKER_ENDED", "FAILED". */
  state?: string;
  order: any;
}

// ----- Public API ----------------------------------------------------------

export const paymentAPI = {
  /**
   * Asks the backend to create a Safepay session for the given order. Returns
   * a checkout URL the app should open in `expo-web-browser`.
   */
  initiateSafepay: async (orderId: string): Promise<SafepayInitiateResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/payments/safepay/initiate`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ orderId }),
    });
    return handleResponse(res);
  },

  /**
   * Re-checks payment status after the user returns from the hosted checkout.
   * Belt-and-braces in case the webhook is delayed.
   */
  verifySafepay: async (orderId: string): Promise<SafepayVerifyResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/payments/safepay/verify/${orderId}`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * Confirms Cash on Delivery for an order. The order is moved to "Confirmed"
   * status and the payment.status remains "Pending" until the rider collects.
   */
  confirmCashOnDelivery: async (orderId: string) => {
    const res = await fetch(`${API_BASE_URL}/api/payments/cod/confirm`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ orderId }),
    });
    return handleResponse(res);
  },
};
