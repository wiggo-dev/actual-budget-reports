import { z } from "zod";

export const REPORT_IDS = [
  "net-worth",
  "account-balances",
  "spending-by-category",
  "payee-spending",
  "income-vs-expenses",
  "budget-vs-actual",
  "cash-flow",
] as const;

export type ReportId = (typeof REPORT_IDS)[number];

export const accountSelectionSchema = z.object({
  excludedAccountIds: z.array(z.string()).default([]),
  excludedCategoryIds: z.array(z.string()).default([]),
  excludedCategoryGroupIds: z.array(z.string()).default([]),
  divergedFromPresetId: z.string().nullable().optional(),
});

export const presetSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  excludedAccountIds: z.array(z.string()).default([]),
  excludedCategoryIds: z.array(z.string()).default([]),
  excludedCategoryGroupIds: z.array(z.string()).default([]),
});

export const timeframeSchema = z.enum([
  "this-month",
  "last-month",
  "2m",
  "3m",
  "6m",
  "12m",
  "24m",
  "all",
  "custom",
]);

export const settingsSchema = z.object({
  presets: z.array(presetSchema),
  reportSelections: z.record(z.string(), accountSelectionSchema),
  selectedPresetId: z.string().nullable().optional(),
  /** @deprecated Prefer trendTimeframe / spendingTimeframe */
  timeframe: timeframeSchema.optional(),
  trendTimeframe: timeframeSchema.optional(),
  spendingTimeframe: timeframeSchema.optional(),
});

export type Settings = z.infer<typeof settingsSchema>;
export type AccountPreset = z.infer<typeof presetSchema>;

export const defaultSettings: Settings = {
  presets: [
    {
      id: "all-accounts",
      name: "All accounts",
      excludedAccountIds: [],
      excludedCategoryIds: [],
      excludedCategoryGroupIds: [],
    },
  ],
  reportSelections: {},
  selectedPresetId: "all-accounts",
  trendTimeframe: "12m",
  spendingTimeframe: "this-month",
};
