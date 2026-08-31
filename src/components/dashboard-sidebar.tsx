"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";

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
import { TIMEFRAMES, type Timeframe } from "@/lib/reports/timeframe";
import { cn } from "@/lib/utils";

export type DashboardView =
  | "overview"
  | "net-worth"
  | "account-balances"
  | "spending-by-category"
  | "income-vs-expenses"
  | "budget-vs-actual"
  | "cash-flow";

export const dashboardViews: { id: DashboardView; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "net-worth", label: "Net worth" },
  { id: "account-balances", label: "Balances" },
  { id: "spending-by-category", label: "Spending" },
  { id: "income-vs-expenses", label: "Income vs expenses" },
  { id: "budget-vs-actual", label: "Budget vs actual" },
  { id: "cash-flow", label: "Cash flow" },
];

type DashboardSidebarProps = {
  active: DashboardView;
  onNavigate: (view: DashboardView) => void;
};

export function DashboardSidebar({
  active,
  onNavigate,
}: DashboardSidebarProps) {
  const {
    accounts,
    excludedAccountIds,
    presets,
    selectedPresetId,
    timeframe,
    setTimeframe,
    toggleAccount,
    applyPreset,
    savePreset,
    refreshData,
    loading,
  } = useReportsContext();
  const [presetName, setPresetName] = useState("");
  const [syncing, setSyncing] = useState(false);

  const excludedNames = accounts
    .filter((account) => excludedAccountIds.includes(account.id))
    .map((account) => account.name);

  const selectedPresetName =
    presets.find((preset) => preset.id === selectedPresetId)?.name ?? null;

  async function handleRefresh() {
    setSyncing(true);
    try {
      await refreshData();
    } finally {
      setSyncing(false);
    }
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col rounded-[2rem] bg-white p-4 shadow-sm">
      <p className="px-2 text-xs tracking-[0.2em] text-emerald-700 uppercase">
        Actual reports
      </p>
      <h1 className="mt-2 px-2 text-lg font-semibold text-zinc-900">Reports</h1>

      <nav className="mt-6 flex flex-col gap-1">
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
          <Label className="px-1 text-xs text-zinc-500">Timeframe</Label>
          <Select
            value={timeframe}
            onValueChange={(value) => {
              if (typeof value === "string" && value) {
                setTimeframe(value as Timeframe);
              }
            }}
          >
            <SelectTrigger className="w-full rounded-2xl border-zinc-200">
              <SelectValue>
                {TIMEFRAMES.find((item) => item.id === timeframe)?.label}
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
        </div>

        <div className="space-y-1.5">
          <Label className="px-1 text-xs text-zinc-500">Preset</Label>
          <Select
            value={selectedPresetId ?? undefined}
            onValueChange={(value) => {
              if (typeof value === "string" && value) {
                applyPreset(value);
              }
            }}
          >
            <SelectTrigger className="w-full rounded-2xl border-zinc-200">
              <SelectValue placeholder="Apply preset">
                {selectedPresetName}
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
        </div>

        <Dialog>
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
            <DialogFooter className="gap-2 sm:justify-between">
              <div className="flex flex-1 items-end gap-2">
                <div className="grid flex-1 gap-1.5">
                  <Label htmlFor="preset-name">Save as preset</Label>
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
                    void savePreset(presetName.trim()).then(() =>
                      setPresetName("")
                    );
                  }}
                >
                  Save
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          variant="secondary"
          className="w-full rounded-2xl"
          onClick={() => void handleRefresh()}
          disabled={loading || syncing}
        >
          <RefreshCw className={syncing ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {excludedNames.length > 0 ? (
        <div className="mt-auto space-y-2 px-2 pt-8 text-xs text-zinc-500">
          <p>Excluded</p>
          {excludedNames.map((name) => (
            <p key={name} className="text-zinc-700">
              − {name}
            </p>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
