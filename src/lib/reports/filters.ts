export type ReportAccount = {
  id: string;
  name: string;
  offbudget?: boolean;
  closed?: boolean;
};

export function filterAccounts(
  accounts: ReportAccount[],
  excludedAccountIds: string[]
): ReportAccount[] {
  const excluded = new Set(excludedAccountIds);
  return accounts.filter((account) => !excluded.has(account.id));
}

export function parseExcludedIds(searchParams: URLSearchParams): string[] {
  const repeated = searchParams.getAll("excludedAccountIds");
  if (repeated.length > 0) {
    return repeated;
  }

  const csv = searchParams.get("excluded");
  if (!csv) {
    return [];
  }

  return csv
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function parseMonths(
  searchParams: URLSearchParams,
  fallback = 12
): number {
  const raw = searchParams.get("months");
  if (!raw) {
    return fallback;
  }

  if (raw === "all") {
    return 120;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, 120);
}
