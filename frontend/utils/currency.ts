/**
 * Single source of truth for money display. Everything is PKR for now; when
 * multi-currency lands, make CURRENCY dynamic (e.g. from the user's
 * preferences.currency) and every screen follows.
 */
export const CURRENCY = {
  code: 'PKR',
  symbol: 'Rs.',
  /** PKR is shown in whole rupees — no paisa / decimal point. */
  fractionDigits: 0,
} as const;

function groupThousands(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** `Rs. 1,234`, or `−Rs. 150` for negatives. Rounds to whole rupees. */
export function formatCurrency(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const rounded = Math.round(Math.abs(safe));
  const formatted = `${CURRENCY.symbol} ${groupThousands(String(rounded))}`;
  return safe < 0 && rounded !== 0 ? `−${formatted}` : formatted;
}
