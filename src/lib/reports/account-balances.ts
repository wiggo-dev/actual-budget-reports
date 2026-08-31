import { actual } from "@/lib/actual/client";
import { integerToAmount } from "@/lib/format";
import { filterAccounts } from "@/lib/reports/filters";

export type AccountBalanceRow = {
  id: string;
  name: string;
  balance: number;
  offbudget: boolean;
};

export async function getAccountBalances(
  excludedAccountIds: string[]
): Promise<AccountBalanceRow[]> {
  const accounts = filterAccounts(
    await actual.getAccounts(),
    excludedAccountIds
  );
  const rows: AccountBalanceRow[] = [];

  for (const account of accounts) {
    const balance = await actual.getAccountBalance(account.id);
    rows.push({
      id: account.id,
      name: account.name,
      balance: integerToAmount(balance),
      offbudget: account.offbudget ?? false,
    });
  }

  return rows.sort((a, b) => b.balance - a.balance);
}
