"use client";

import {
  useReportData,
  useReportsContext,
} from "@/components/reports-provider";
import { formatMoney } from "@/lib/format";
import type { UpcomingScheduleRow } from "@/lib/reports/upcoming-schedules";
import { cn } from "@/lib/utils";

function formatScheduleDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(parsed);
}

function statusLabel(status: UpcomingScheduleRow["status"]) {
  switch (status) {
    case "due":
      return "Due today";
    case "overdue":
      return "Overdue";
    default:
      return "Upcoming";
  }
}

export function UpcomingSchedulesPanel({ className }: { className?: string }) {
  const { currency } = useReportsContext();
  const money = (amount: number) => formatMoney(amount, currency);
  const { data, loading, error } = useReportData<UpcomingScheduleRow[]>(
    "upcoming-schedules",
    "accounts"
  );

  if (loading) {
    return (
      <div className={cn("rounded-[2rem] bg-white p-6 shadow-sm", className)}>
        <p className="text-sm text-zinc-500">Loading upcoming schedules…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("rounded-[2rem] bg-white p-6 shadow-sm", className)}>
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-[2rem] bg-white p-6 shadow-sm", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">Upcoming</p>
          <p className="mt-1 text-sm text-zinc-400">Next 30 days</p>
        </div>
      </div>

      {!data?.length ? (
        <p className="text-sm text-zinc-500">
          No scheduled transactions in the next 30 days.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {data.map((row) => (
            <li
              key={row.id}
              className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="font-medium text-zinc-900">{row.name}</p>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {formatScheduleDate(row.date)}
                  {row.accountName ? ` · ${row.accountName}` : null}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className="font-mono text-sm font-medium tabular-nums text-zinc-900"
                  data-privacy-value
                >
                  {money(row.amount)}
                </p>
                <p
                  className={cn(
                    "mt-1 text-xs font-medium",
                    row.status === "overdue" && "text-rose-600",
                    row.status === "due" && "text-amber-700",
                    row.status === "upcoming" && "text-zinc-400"
                  )}
                >
                  {statusLabel(row.status)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
