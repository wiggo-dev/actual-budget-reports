import { utils } from "@actual-app/api";

const localeByCurrency: Record<string, string> = {
  GBP: "en-GB",
  USD: "en-US",
  EUR: "de-DE",
};

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatMoney(
  amount: number,
  currency = "GBP",
  options?: { hideFraction?: boolean }
): string {
  const locale = localeByCurrency[currency] ?? "en-GB";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: options?.hideFraction ? 0 : 2,
    minimumFractionDigits: options?.hideFraction ? 0 : 2,
  }).format(amount);
}

export function integerToAmount(value: number): number {
  return utils.integerToAmount(value);
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthEnd(date: Date): string {
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return formatLocalDate(end);
}

export function monthsBack(count: number): Date[] {
  const now = new Date();
  const months: Date[] = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  }

  return months;
}
