import { describe, expect, it } from "vitest";

import {
  filterUpcomingSchedules,
  resolveScheduleAmount,
  scheduleStatus,
} from "@/lib/reports/upcoming-schedules";

describe("scheduleStatus", () => {
  it("classifies dates relative to today", () => {
    expect(scheduleStatus("2025-09-01", "2025-09-01")).toBe("due");
    expect(scheduleStatus("2025-08-31", "2025-09-01")).toBe("overdue");
    expect(scheduleStatus("2025-09-02", "2025-09-01")).toBe("upcoming");
  });
});

describe("resolveScheduleAmount", () => {
  it("averages ranged schedule amounts", () => {
    expect(resolveScheduleAmount({ num1: -10000, num2: -20000 })).toBe(-150);
  });
});

describe("filterUpcomingSchedules", () => {
  const accountNames = new Map([
    ["checking", "Checking"],
    ["savings", "Savings"],
  ]);

  it("drops completed schedules and excluded accounts", () => {
    const rows = filterUpcomingSchedules(
      [
        {
          id: "1",
          name: "Rent",
          next_date: "2025-09-05",
          amount: 1200,
          account: "checking",
        },
        {
          id: "2",
          name: "Done",
          next_date: "2025-09-06",
          completed: true,
          account: "checking",
        },
        {
          id: "3",
          name: "Hidden",
          next_date: "2025-09-07",
          amount: 50,
          account: "savings",
        },
      ],
      {
        excludedAccountIds: ["savings"],
        accountNames,
        today: "2025-09-01",
        horizonDays: 30,
      }
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: "1",
      accountName: "Checking",
      status: "upcoming",
    });
  });

  it("includes overdue schedules within the horizon window", () => {
    const rows = filterUpcomingSchedules(
      [
        {
          id: "1",
          name: "Late bill",
          next_date: "2025-08-28",
          amount: -40,
          account: "checking",
        },
      ],
      {
        excludedAccountIds: [],
        accountNames,
        today: "2025-09-01",
        horizonDays: 30,
      }
    );

    expect(rows[0]?.status).toBe("overdue");
  });
});
