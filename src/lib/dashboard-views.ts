export type DashboardView =
  | "overview"
  | "net-worth"
  | "account-balances"
  | "spending-by-category"
  | "payee-spending"
  | "income-vs-expenses"
  | "budget-vs-actual"
  | "cash-flow";

export const dashboardViews: { id: DashboardView; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "net-worth", label: "Net worth" },
  { id: "account-balances", label: "Balances" },
  { id: "spending-by-category", label: "Spending" },
  { id: "payee-spending", label: "Payees" },
  { id: "income-vs-expenses", label: "Income vs expenses" },
  { id: "budget-vs-actual", label: "Budget vs actual" },
  { id: "cash-flow", label: "Cash flow" },
];
