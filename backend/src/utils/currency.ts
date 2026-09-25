/**
 * Money display for server-generated text (push notifications etc.).
 * PKR only for now, shown in whole rupees — PKR has no paisa in practice.
 */
export const CURRENCY_CODE = 'PKR';

/** Rounds to whole rupees (PKR amounts carry no decimal part). */
export function roundPKR(amount: number): number {
  return Math.round(amount);
}

/** `Rs. 1,234` (sign dropped; callers word negatives themselves). */
export function formatPKR(amount: number): string {
  const whole = String(Math.abs(roundPKR(amount))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `Rs. ${whole}`;
}
