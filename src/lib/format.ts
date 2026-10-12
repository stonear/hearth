import { currencyFactor } from "./mortgage";
export function formatMoney(minorUnits: number, currency: string): string {
  const digits = currencyFactor(currency) === 1 ? 0 : 2;
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(minorUnits / currencyFactor(currency));
}
export function compactMoney(minorUnits: number, currency: string): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(minorUnits / currencyFactor(currency));
}
export function formatDate(date: string, short = false): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: short ? "short" : "long",
    ...(short ? {} : { day: "numeric" }),
  }).format(new Date(y, m - 1, d, 12));
}
export function duration(months: number): string {
  const years = Math.floor(months / 12),
    remainder = months % 12;
  return (
    [years ? `${years}y` : "", remainder ? `${remainder}m` : ""]
      .filter(Boolean)
      .join(" ") || "0 months"
  );
}
