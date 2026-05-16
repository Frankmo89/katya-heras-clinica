// Pure price-formatting utility — no React dependency.
// Used by both public-facing pages and the admin panel.

export type Currency = 'MXN' | 'USD';

/**
 * Formats a numeric amount with the currency symbol and ISO suffix.
 *
 * Examples:
 *   formatPrice(1800, 'MXN') → "$1,800\u00a0MXN"
 *   formatPrice(100,  'USD') → "$100\u00a0USD"
 *
 * Integers are always shown without decimal places.
 */
export function formatPrice(amount: number, currency: Currency): string {
  const locale    = currency === 'MXN' ? 'es-MX' : 'en-US';
  const formatted = amount.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `$${formatted}\u00a0${currency}`;
}
