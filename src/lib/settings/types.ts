import { z } from "zod";

export const REPORT_IDS = [
  "net-worth",
  "account-balances",
  "spending-by-category",
  "income-vs-expenses",
  "budget-vs-actual",
  "cash-flow",
] as const;

export type ReportId = (typeof REPORT_IDS)[number];

export const accountSelectionSchema = z.object({
  excludedAccountIds: z.array(z.string()),
});

export const presetSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  excludedAccountIds: z.array(z.string()),
});

export const settingsSchema = z.object({
  presets: z.array(presetSchema),
  reportSelections: z.record(z.string(), accountSelectionSchema),
});

export type Settings = z.infer<typeof settingsSchema>;
export type AccountPreset = z.infer<typeof presetSchema>;

export const defaultSettings: Settings = {
  presets: [
    {
      id: "all-accounts",
      name: "All accounts",
      excludedAccountIds: [],
    },
  ],
  reportSelections: {},
};
