/** PROTOTYPE mock data — not wired to Actual. */

export const prototypeState = {
  preset: "Liquid net worth",
  excluded: ["Mortgage", "Help to Buy"],
  syncedAt: "2 minutes ago",
};

export const kpis = {
  netWorth: 248_420,
  netWorthDelta: 0.042,
  liquid: 41_280,
  spentThisMonth: 3_184,
  incomeThisMonth: 5_620,
};

export const netWorth = [
  { month: "Sep", value: 221_400 },
  { month: "Oct", value: 224_110 },
  { month: "Nov", value: 226_890 },
  { month: "Dec", value: 229_050 },
  { month: "Jan", value: 231_800 },
  { month: "Feb", value: 233_410 },
  { month: "Mar", value: 236_200 },
  { month: "Apr", value: 238_940 },
  { month: "May", value: 241_100 },
  { month: "Jun", value: 243_670 },
  { month: "Jul", value: 245_880 },
  { month: "Aug", value: 248_420 },
];

export const cashFlow = [
  { month: "Mar", in: 5420, out: 3100 },
  { month: "Apr", in: 5480, out: 2980 },
  { month: "May", in: 5510, out: 3340 },
  { month: "Jun", in: 5600, out: 2890 },
  { month: "Jul", in: 5580, out: 3520 },
  { month: "Aug", in: 5620, out: 3184 },
];

export const spending = [
  { name: "Groceries", amount: 612 },
  { name: "Eating out", amount: 284 },
  { name: "Transport", amount: 196 },
  { name: "Utilities", amount: 178 },
  { name: "Subscriptions", amount: 94 },
];

export const accounts = [
  { name: "Current", balance: 4_820, kind: "liquid" },
  { name: "Rainy day", balance: 18_400, kind: "liquid" },
  { name: "ISA", balance: 62_110, kind: "invest" },
  { name: "Pension", balance: 141_090, kind: "invest" },
  { name: "Mortgage", balance: -214_500, kind: "debt" },
];

export const reports = [
  { id: "net-worth", label: "Net worth" },
  { id: "balances", label: "Balances" },
  { id: "spending", label: "Spending" },
  { id: "income", label: "Income vs expenses" },
  { id: "budget", label: "Budget vs actual" },
  { id: "cash", label: "Cash flow" },
];

export function gbp(value: number) {
  const sign = value < 0 ? "−" : "";
  return `${sign}£${Math.abs(value).toLocaleString("en-GB", {
    maximumFractionDigits: 0,
  })}`;
}

export function pct(value: number) {
  const sign = value >= 0 ? "+" : "−";
  return `${sign}${(Math.abs(value) * 100).toFixed(1)}%`;
}
