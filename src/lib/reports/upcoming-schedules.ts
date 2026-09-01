import { actual } from "@/lib/actual/client";
import { formatLocalDate, integerToAmount } from "@/lib/format";
import { filterAccounts } from "@/lib/reports/filters";

export type ScheduleInput = {
  id: string;
  name: string;
  next_date?: string;
  completed?: boolean;
  account?: string;
  amount?: number;
};

export type UpcomingScheduleRow = {
  id: string;
  name: string;
  date: string;
  amount: number;
  accountId: string | null;
  accountName: string | null;
  status: "upcoming" | "due" | "overdue";
};

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function scheduleStatus(
  date: string,
  today: string
): UpcomingScheduleRow["status"] {
  if (date < today) {
    return "overdue";
  }
  if (date === today) {
    return "due";
  }
  return "upcoming";
}

export function filterUpcomingSchedules(
  schedules: ScheduleInput[],
  options: {
    excludedAccountIds: string[];
    accountNames: Map<string, string>;
    today?: string;
    horizonDays?: number;
  }
): UpcomingScheduleRow[] {
  const today = options.today ?? formatLocalDate(new Date());
  const horizonDays = options.horizonDays ?? 30;
  const horizonEnd = formatLocalDate(
    addDays(new Date(`${today}T00:00:00`), horizonDays)
  );
  const excluded = new Set(options.excludedAccountIds);
  const rows: UpcomingScheduleRow[] = [];

  for (const schedule of schedules) {
    if (schedule.completed) {
      continue;
    }

    const date = schedule.next_date?.trim();
    if (!date) {
      continue;
    }

    if (date > horizonEnd) {
      continue;
    }

    const accountId = schedule.account?.trim() || null;
    if (accountId && excluded.has(accountId)) {
      continue;
    }

    rows.push({
      id: schedule.id,
      name: schedule.name,
      date,
      amount: schedule.amount ?? 0,
      accountId,
      accountName: accountId
        ? (options.accountNames.get(accountId) ?? null)
        : null,
      status: scheduleStatus(date, today),
    });
  }

  return rows.sort((left, right) => left.date.localeCompare(right.date));
}

export function resolveScheduleAmount(
  amount: number | { num1: number; num2: number } | undefined
): number | undefined {
  if (amount == null) {
    return undefined;
  }

  if (typeof amount === "number") {
    return integerToAmount(amount);
  }

  const average = Math.round((amount.num1 + amount.num2) / 2);
  return integerToAmount(average);
}

export async function getUpcomingSchedules(
  excludedAccountIds: string[],
  horizonDays = 30
): Promise<UpcomingScheduleRow[]> {
  const accounts = filterAccounts(
    await actual.getAccounts(),
    excludedAccountIds
  );
  const accountNames = new Map(
    accounts.map((account) => [account.id, account.name])
  );
  const schedules = await actual.getSchedules();

  return filterUpcomingSchedules(
    schedules.map((schedule) => ({
      id: schedule.id,
      name: schedule.name ?? "Scheduled transaction",
      next_date: schedule.next_date,
      completed: schedule.completed,
      account: schedule.account,
      amount: resolveScheduleAmount(schedule.amount),
    })),
    {
      excludedAccountIds,
      accountNames,
      horizonDays,
    }
  );
}
