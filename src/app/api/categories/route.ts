import { actual, syncIfNeeded } from "@/lib/actual/client";
import { withActual } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  return withActual(async () => {
    await syncIfNeeded();
    const [groups, categories] = await Promise.all([
      actual.getCategoryGroups(),
      actual.getCategories(),
    ]);

    return {
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        isIncome: group.is_income ?? false,
      })),
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        groupId: category.group_id,
        isIncome: category.is_income ?? false,
      })),
    };
  });
}
