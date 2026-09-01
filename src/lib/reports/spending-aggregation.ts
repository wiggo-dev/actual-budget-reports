import type { SpendingAggregation } from "@/lib/reports/spending-by-category";

export function parseSpendingAggregation(
  searchParams: URLSearchParams
): SpendingAggregation {
  const raw = searchParams.get("spendingLevel");
  if (raw === "group") {
    return "group";
  }
  return "category";
}

export function parseSpendingGroupId(
  searchParams: URLSearchParams
): string | undefined {
  const groupId = searchParams.get("groupId");
  return groupId?.trim() || undefined;
}
