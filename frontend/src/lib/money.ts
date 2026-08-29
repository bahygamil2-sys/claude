export function toNumber(value: string | number): number {
  return typeof value === "number" ? value : parseFloat(value);
}

export function formatMoney(value: string | number, currencyLabel: string, locale: string): string {
  const n = toNumber(value);
  const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  return `${formatted} ${currencyLabel}`;
}
