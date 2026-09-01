export const OVERVIEW_MODULE_IDS = [
  "net-worth",
  "savings-rate",
  "spending-period",
  "spending-mix",
  "cash-flow",
  "upcoming",
  "accounts",
] as const;

export type OverviewModuleId = (typeof OVERVIEW_MODULE_IDS)[number];

export const overviewModules: {
  id: OverviewModuleId;
  label: string;
}[] = [
  { id: "net-worth", label: "Net worth" },
  { id: "savings-rate", label: "Savings rate" },
  { id: "spending-period", label: "Spending" },
  { id: "spending-mix", label: "Spending mix" },
  { id: "cash-flow", label: "Cash flow" },
  { id: "upcoming", label: "Upcoming" },
  { id: "accounts", label: "Accounts" },
];

export function isOverviewModuleVisible(
  moduleId: OverviewModuleId,
  hiddenModuleIds: readonly string[]
): boolean {
  return !hiddenModuleIds.includes(moduleId);
}

export function defaultHiddenOverviewModules(): OverviewModuleId[] {
  return [];
}
