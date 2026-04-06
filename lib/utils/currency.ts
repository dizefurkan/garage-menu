/**
 * Currency code to symbol mapping
 * @param code - Currency code (e.g., 'TRY', 'USD', 'EUR')
 * @returns Currency symbol
 */
export function getCurrencySymbol(code: string): string {
  const symbols: Record<string, string> = {
    TRY: "₺",
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CNY: "¥",
    INR: "₹",
    AED: "د.إ",
    SAR: "﷼",
  };
  return symbols[code] || code;
}

/**
 * Format price with currency symbol
 * @param price - Price amount
 * @param currency - Currency code (e.g., 'TRY')
 * @param locale - Language locale (e.g., 'tr-TR', 'en-US')
 * @returns Formatted price string with symbol
 */
export function formatPrice(
  price: number,
  currency: string,
  locale: string = "en-US"
): string {
  const symbol = getCurrencySymbol(currency);

  try {
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    const formattedNumber = formatter.format(price);

    // Place symbol before number for most currencies, after for some
    if (["USD", "GBP", "EUR"].includes(currency)) {
      return `${symbol}${formattedNumber}`;
    }
    return `${formattedNumber}${symbol}`;
  } catch {
    // Fallback if formatter fails
    return `${price}${symbol}`;
  }
}
