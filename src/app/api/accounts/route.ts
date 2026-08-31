import { actual, syncIfNeeded } from "@/lib/actual/client";
import { withActual } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  return withActual(async () => {
    await syncIfNeeded();
    const accounts = await actual.getAccounts();
    return accounts.map((account) => ({
      id: account.id,
      name: account.name,
      offbudget: account.offbudget ?? false,
      closed: account.closed ?? false,
    }));
  });
}
