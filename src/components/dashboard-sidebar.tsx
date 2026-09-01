"use client";

import { Info, Menu } from "lucide-react";
import { useState } from "react";

import { DashboardToolbar } from "@/components/dashboard-toolbar";
import { useReportsContext } from "@/components/reports-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CustomDateRangeFields } from "@/components/custom-date-range-fields";
import {
  defaultCustomRange,
  type CustomDateRange,
} from "@/lib/reports/report-range";
import { dashboardViews, type DashboardView } from "@/lib/dashboard-views";
import { TIMEFRAMES, type Timeframe } from "@/lib/reports/timeframe";
import { cn } from "@/lib/utils";

export type { DashboardView };
export { dashboardViews };

function TimeframeInfo({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex items-center gap-1 px-1">
      <Label className="text-xs text-zinc-500">{label}</Label>
      <Tooltip>
        <TooltipTrigger
          type="button"
          className="rounded-full p-0.5 text-zinc-400 transition-colors hover:text-zinc-600"
          aria-label={`${label} details`}
        >
          <Info className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[220px] text-left">
          {detail}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

type DashboardSidebarPanelProps = {
  active: DashboardView;
  onNavigate: (view: DashboardView) => void;
  showHeader?: boolean;
};

function DashboardSidebarPanel({
  active,
  onNavigate,
  showHeader = true,
}: DashboardSidebarPanelProps) {
  const {
    accounts,
    categoryGroups,
    categories,
    excludedAccountIds,
    excludedCategoryIds,
    excludedCategoryGroupIds,
    presets,
    selectedPresetId,
    divergedFromPresetId,
    trendTimeframe,
    spendingTimeframe,
    trendCustomRange,
    spendingCustomRange,
    trendScopeLabel,
    spendingScopeLabel,
    setTrendTimeframe,
    setSpendingTimeframe,
    setTrendCustomRange,
    setSpendingCustomRange,
    toggleAccount,
    toggleCategory,
    toggleCategoryGroup,
    applyPreset,
    savePreset,
    renamePreset,
    updatePreset,
    loading,
    versionHealth,
  } = useReportsContext();
  const [presetName, setPresetName] = useState("");
  const [editPresetId, setEditPresetId] = useState<string | null>(null);
  const [editPresetName, setEditPresetName] = useState("");
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const excludedAccountNames = accounts
    .filter((account) => excludedAccountIds.includes(account.id))
    .map((account) => account.name);
  const excludedGroupNames = categoryGroups
    .filter((group) => excludedCategoryGroupIds.includes(group.id))
    .map((group) => group.name);
  const excludedCategoryNames = categories
    .filter(
      (category) =>
        excludedCategoryIds.includes(category.id) &&
        !excludedCategoryGroupIds.includes(category.groupId)
    )
    .map((category) => category.name);

  const selectedPresetName = presets.find(
    (preset) => preset.id === selectedPresetId
  )?.name;
  const divergedPresetName = presets.find(
    (preset) => preset.id === divergedFromPresetId
  )?.name;
  const hasCustomFilters =
    excludedAccountIds.length > 0 ||
    excludedCategoryIds.length > 0 ||
    excludedCategoryGroupIds.length > 0;
  const presetTriggerLabel = selectedPresetName
    ? selectedPresetName
    : divergedFromPresetId
      ? "Unsaved changes"
      : hasCustomFilters
        ? "Custom filters"
        : undefined;

  const editTargetId =
    editPresetId && presets.some((preset) => preset.id === editPresetId)
      ? editPresetId
      : (selectedPresetId ?? divergedFromPresetId ?? presets[0]?.id ?? null);

  const editTargetName =
    presets.find((preset) => preset.id === editTargetId)?.name ?? "";

  const trendRange: CustomDateRange = trendCustomRange ?? defaultCustomRange();
  const spendingRange: CustomDateRange =
    spendingCustomRange ?? defaultCustomRange();

  return (
    <>
      {showHeader ? (
        <>
          <p className="px-2 text-xs tracking-[0.2em] text-emerald-700 uppercase">
            Actual reports
          </p>
          <h1 className="mt-2 px-2 text-lg font-semibold text-zinc-900">
            Reports
          </h1>
        </>
      ) : null}

      <nav className={cn("flex flex-col gap-1", showHeader ? "mt-6" : "mt-2")}>
        {dashboardViews.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => onNavigate(view.id)}
            className={cn(
              "rounded-2xl px-3 py-2.5 text-left text-sm transition-colors",
              active === view.id
                ? "bg-lime-300 font-medium text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-50"
            )}
          >
            {view.label}
          </button>
        ))}
      </nav>

      <div className="mt-6 space-y-3 px-2">
        <div className="space-y-1.5">
          <TimeframeInfo
            label="Trends"
            detail="Applies to net worth, cash flow, and income vs expenses."
          />
          <Select
            value={trendTimeframe}
            onValueChange={(value) => {
              if (typeof value === "string" && value) {
                setTrendTimeframe(value as Timeframe);
              }
            }}
          >
            <SelectTrigger className="w-full rounded-2xl border-zinc-200">
              <SelectValue placeholder={loading ? "…" : "Trends"}>
                {trendScopeLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TIMEFRAMES.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {trendTimeframe === "custom" ? (
            <CustomDateRangeFields
              idPrefix="trend"
              value={trendRange}
              onChange={setTrendCustomRange}
            />
          ) : null}
        </div>

        <div className="space-y-1.5">
          <TimeframeInfo
            label="Spending"
            detail="Applies to category spending mix, totals, and budget vs actual."
          />
          <Select
            value={spendingTimeframe}
            onValueChange={(value) => {
              if (typeof value === "string" && value) {
                setSpendingTimeframe(value as Timeframe);
              }
            }}
          >
            <SelectTrigger className="w-full rounded-2xl border-zinc-200">
              <SelectValue placeholder={loading ? "…" : "Spending"}>
                {spendingScopeLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TIMEFRAMES.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {spendingTimeframe === "custom" ? (
            <CustomDateRangeFields
              idPrefix="spending"
              value={spendingRange}
              onChange={setSpendingCustomRange}
            />
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label className="px-1 text-xs text-zinc-500">Preset</Label>
          <Select
            value={selectedPresetId}
            onValueChange={(value) => {
              if (typeof value === "string" && value) {
                applyPreset(value);
              }
            }}
          >
            <SelectTrigger
              className={cn(
                "w-full rounded-2xl border-zinc-200",
                divergedFromPresetId &&
                  "border-amber-300 bg-amber-50 text-amber-950"
              )}
            >
              <SelectValue placeholder={loading ? "…" : "Choose preset"}>
                {presetTriggerLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {divergedFromPresetId ? (
            <p className="px-1 text-xs leading-relaxed text-amber-800">
              Filters changed
              {divergedPresetName ? ` from “${divergedPresetName}”` : ""}. Open{" "}
              <span className="font-medium">Accounts</span> to update that
              preset or save a new one.
            </p>
          ) : null}
        </div>

        <Dialog
          open={accountsOpen}
          onOpenChange={(open) => {
            setAccountsOpen(open);
            if (open) {
              const nextId =
                selectedPresetId ??
                divergedFromPresetId ??
                presets[0]?.id ??
                null;
              setEditPresetId(nextId);
              setEditPresetName(
                presets.find((preset) => preset.id === nextId)?.name ?? ""
              );
            }
          }}
        >
          <DialogTrigger
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full rounded-2xl"
            )}
          >
            Accounts
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-[2rem]">
            <DialogHeader>
              <DialogTitle>Included accounts</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-zinc-500">
              All accounts are included by default. Uncheck accounts to exclude
              them from reports.
            </p>
            <ScrollArea className="h-64 pr-3">
              <div className="space-y-5">
                {(
                  [
                    ["On budget", accounts.filter((a) => !a.offbudget)],
                    ["Off budget", accounts.filter((a) => a.offbudget)],
                  ] as const
                ).map(([group, groupAccounts]) =>
                  groupAccounts.length === 0 ? null : (
                    <div key={group} className="space-y-3">
                      <p className="text-xs tracking-wide text-zinc-500 uppercase">
                        {group}
                      </p>
                      {groupAccounts.map((account) => {
                        const included = !excludedAccountIds.includes(
                          account.id
                        );
                        return (
                          <label
                            key={account.id}
                            className="flex items-center gap-3 text-sm"
                          >
                            <Checkbox
                              checked={included}
                              onCheckedChange={() => toggleAccount(account.id)}
                            />
                            <span>{account.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            </ScrollArea>
            <DialogFooter className="flex-col gap-4 sm:flex-col sm:justify-stretch">
              <div className="flex w-full items-end gap-2">
                <div className="grid flex-1 gap-1.5">
                  <Label htmlFor="preset-name">Save as new preset</Label>
                  <Input
                    id="preset-name"
                    value={presetName}
                    onChange={(event) => setPresetName(event.target.value)}
                    placeholder="Liquid net worth"
                    className="rounded-2xl"
                  />
                </div>
                <Button
                  type="button"
                  disabled={!presetName.trim()}
                  className="rounded-2xl"
                  onClick={() => {
                    void savePreset(presetName.trim())
                      .then(() => setPresetName(""))
                      .catch(() => {
                        /* error surfaced via reports context */
                      });
                  }}
                >
                  Save
                </Button>
              </div>

              {presets.length > 0 && editTargetId ? (
                <div className="w-full space-y-2 border-t border-zinc-100 pt-4">
                  <Label className="text-xs text-zinc-500">
                    Existing preset
                  </Label>
                  <Select
                    value={editTargetId}
                    onValueChange={(value) => {
                      if (typeof value === "string" && value) {
                        setEditPresetId(value);
                        setEditPresetName(
                          presets.find((preset) => preset.id === value)?.name ??
                            ""
                        );
                      }
                    }}
                  >
                    <SelectTrigger className="w-full rounded-2xl border-zinc-200">
                      <SelectValue>{editTargetName}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {presets.map((preset) => (
                        <SelectItem key={preset.id} value={preset.id}>
                          {preset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-end gap-2">
                    <div className="grid flex-1 gap-1.5">
                      <Label htmlFor="edit-preset-name">Name</Label>
                      <Input
                        id="edit-preset-name"
                        value={editPresetName}
                        onChange={(event) =>
                          setEditPresetName(event.target.value)
                        }
                        className="rounded-2xl"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        !editPresetName.trim() ||
                        editPresetName.trim() === editTargetName
                      }
                      className="rounded-2xl"
                      onClick={() => {
                        void renamePreset(editTargetId, editPresetName.trim());
                      }}
                    >
                      Rename
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="rounded-2xl"
                      onClick={() => {
                        void updatePreset(editTargetId);
                      }}
                    >
                      Update
                    </Button>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Update saves the current account and category selection to
                    this preset.
                  </p>
                </div>
              ) : null}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={categoriesOpen} onOpenChange={setCategoriesOpen}>
          <DialogTrigger
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full rounded-2xl"
            )}
          >
            Categories
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-[2rem]">
            <DialogHeader>
              <DialogTitle>Included categories</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-zinc-500">
              All categories are included by default. Uncheck groups or
              categories to exclude them from spending reports.
            </p>
            <ScrollArea className="h-64 pr-3">
              <div className="space-y-5">
                {categoryGroups.map((group) => {
                  const groupCategories = categories.filter(
                    (category) => category.groupId === group.id
                  );
                  if (groupCategories.length === 0) {
                    return null;
                  }

                  const groupExcluded = excludedCategoryGroupIds.includes(
                    group.id
                  );

                  return (
                    <div key={group.id} className="space-y-3">
                      <label className="flex items-center gap-3 text-sm font-medium">
                        <Checkbox
                          checked={!groupExcluded}
                          onCheckedChange={() => toggleCategoryGroup(group.id)}
                        />
                        <span>{group.name}</span>
                      </label>
                      <div className="space-y-2 pl-7">
                        {groupCategories.map((category) => {
                          const included =
                            !groupExcluded &&
                            !excludedCategoryIds.includes(category.id);
                          return (
                            <label
                              key={category.id}
                              className="flex items-center gap-3 text-sm text-zinc-700"
                            >
                              <Checkbox
                                checked={included}
                                disabled={groupExcluded}
                                onCheckedChange={() =>
                                  toggleCategory(category.id)
                                }
                              />
                              <span>{category.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {versionHealth?.compatible === false ? (
          <div className="space-y-1 px-1 text-xs">
            <p className="text-amber-700" role="status">
              Actual API {versionHealth.api} vs server{" "}
              {versionHealth.server ?? "unknown"} — pin matching major.minor
              versions.
            </p>
          </div>
        ) : null}

        {excludedAccountNames.length > 0 ||
        excludedGroupNames.length > 0 ||
        excludedCategoryNames.length > 0 ? (
          <div className="space-y-2 text-xs text-zinc-500">
            <p>Excluded</p>
            {excludedAccountNames.map((name) => (
              <p key={`account-${name}`} className="text-zinc-700">
                − {name} <span className="text-zinc-400">· account</span>
              </p>
            ))}
            {excludedGroupNames.map((name) => (
              <p key={`group-${name}`} className="text-zinc-700">
                − {name} <span className="text-zinc-400">· group</span>
              </p>
            ))}
            {excludedCategoryNames.map((name) => (
              <p key={`category-${name}`} className="text-zinc-700">
                − {name} <span className="text-zinc-400">· category</span>
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}

type DashboardSidebarProps = {
  active: DashboardView;
  onNavigate: (view: DashboardView) => void;
};

export function DashboardMobileNav({
  active,
  onNavigate,
}: DashboardSidebarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const activeLabel =
    dashboardViews.find((view) => view.id === active)?.label ?? "Reports";

  function handleNavigate(view: DashboardView) {
    onNavigate(view);
    setMenuOpen(false);
  }

  return (
    <>
      <header className="sticky top-0 z-30 -mx-4 mb-2 flex items-center gap-3 border-b border-zinc-200/80 bg-[#f6f4f0]/95 px-4 py-3 backdrop-blur-sm md:hidden">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 rounded-xl"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
        >
          <Menu className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-xs tracking-wide text-emerald-700 uppercase">
            Actual reports
          </p>
          <p className="truncate font-semibold text-zinc-900">{activeLabel}</p>
        </div>
        <DashboardToolbar compact />
      </header>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent
          showCloseButton
          className="fixed inset-y-0 left-0 top-0 flex h-dvh w-[min(100vw,18rem)] max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none rounded-r-[2rem] border-0 bg-white p-0 shadow-xl data-open:slide-in-from-left data-closed:slide-out-to-left sm:max-w-none"
        >
          <div className="shrink-0 border-b border-zinc-100 px-4 py-3 pr-14">
            <p className="font-semibold text-zinc-900">Menu</p>
            <p className="text-xs text-zinc-500">Reports & filters</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <DashboardSidebarPanel
              active={active}
              onNavigate={handleNavigate}
              showHeader={false}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DashboardSidebar({
  active,
  onNavigate,
}: DashboardSidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col rounded-[2rem] bg-white p-4 shadow-sm md:flex">
      <DashboardSidebarPanel active={active} onNavigate={onNavigate} />
    </aside>
  );
}
