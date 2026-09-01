export type CategoryExclusions = {
  excludedCategoryIds: string[];
  excludedCategoryGroupIds: string[];
};

export type CategoryMeta = {
  id: string;
  groupId: string;
};

export function buildCategoryGroupIndex(
  categories: CategoryMeta[]
): Map<string, string> {
  return new Map(categories.map((category) => [category.id, category.groupId]));
}

export function buildExcludedCategoryIdSet(
  exclusions: CategoryExclusions,
  categoryGroupIndex: Map<string, string>
): Set<string> {
  const excluded = new Set(exclusions.excludedCategoryIds);
  const excludedGroups = new Set(exclusions.excludedCategoryGroupIds);

  if (excludedGroups.size === 0) {
    return excluded;
  }

  for (const [categoryId, groupId] of categoryGroupIndex) {
    if (excludedGroups.has(groupId)) {
      excluded.add(categoryId);
    }
  }

  return excluded;
}

export function isCategoryExcluded(
  categoryId: string | undefined,
  excludedCategoryIds: Set<string>
): boolean {
  if (!categoryId) {
    return false;
  }
  return excludedCategoryIds.has(categoryId);
}

export function parseExcludedCategoryIds(
  searchParams: URLSearchParams
): string[] {
  const repeated = searchParams.getAll("excludedCategoryIds");
  if (repeated.length > 0) {
    return repeated;
  }

  const csv = searchParams.get("excludedCategories");
  if (!csv) {
    return [];
  }

  return csv
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function parseExcludedCategoryGroupIds(
  searchParams: URLSearchParams
): string[] {
  const repeated = searchParams.getAll("excludedCategoryGroupIds");
  if (repeated.length > 0) {
    return repeated;
  }

  const csv = searchParams.get("excludedCategoryGroups");
  if (!csv) {
    return [];
  }

  return csv
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}
