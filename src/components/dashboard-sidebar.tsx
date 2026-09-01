"use client";

import { Info, RefreshCw } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TIMEFRAMES, type Timeframe } from "@/lib/reports/timeframe";
import { dashboardViews, type DashboardView } from "@/lib/dashboard-views";
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
    trendTimeframe,
    spendingTimeframe,
    setTrendTimeframe,
    setSpendingTimeframe,
    toggleAccount,
    applyPreset,
    savePreset,
    renamePreset,
    updatePreset,
    refreshData,
    loading,
  } = useReportsContext();
  const [presetName, setPresetName] = useState("");
  const [editPresetId, setEditPresetId] = useState<string | null>(null);
  const [editPresetName, setEditPresetName] = useState("");
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const excludedNames = accounts
    .filter((account) => excludedAccountIds.includes(account.id))
    .map((account) => account.name);

  const selectedPresetName = presets.find(
    (preset) => preset.id === selectedPresetId
  )?.name;

  const editTargetId =
    editPresetId && presets.some((preset) => preset.id === editPresetId)
      ? editPresetId
      : (selectedPresetId ?? presets[0]?.id ?? null);

  const editTargetName =
    presets.find((preset) => preset.id === editTargetId)?.name ?? "";

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
              <SelectValue>
                {TIMEFRAMES.find((item) => item.id === trendTimeframe)?.label}
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
              <SelectValue>
                {
                  TIMEFRAMES.find((item) => item.id === spendingTimeframe)
                    ?.label
                }
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
            value={selectedPresetId}
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

        <Dialog
          open={accountsOpen}
          onOpenChange={(open) => {
            setAccountsOpen(open);
            if (open) {
              const nextId = selectedPresetId ?? presets[0]?.id ?? null;
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
                    Update saves the current account selection to this preset.
                  </p>
                </div>
              ) : null}
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

        {excludedNames.length > 0 ? (
          <div className="space-y-2 text-xs text-zinc-500">
            <p>Excluded</p>
            {excludedNames.map((name) => (
              <p key={name} className="text-zinc-700">
                − {name}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
