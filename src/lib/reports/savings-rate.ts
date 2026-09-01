export function savingsRate(income: number, expenses: number): number | null {
  if (!Number.isFinite(income) || income <= 0) {
    return null;
  }
  return (income - expenses) / income;
}

export function monthlySavingsRates(
  points: { month: string; income: number; expenses: number }[]
): { month: string; rate: number | null }[] {
  return points.map((point) => ({
    month: point.month,
    rate: savingsRate(point.income, point.expenses),
  }));
}
