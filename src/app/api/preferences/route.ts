import { getBudgetPreferences, syncIfNeeded } from "@/lib/actual/client";
import { withActual } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  return withActual(async () => {
    await syncIfNeeded();
    const preferences = await getBudgetPreferences();
    return {
      currency: preferences.defaultCurrencyCode ?? "GBP",
      preferences,
    };
  });
}
