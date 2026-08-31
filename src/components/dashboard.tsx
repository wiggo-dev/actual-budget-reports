"use client";

import { useState } from "react";

import {
  DashboardSidebar,
  type DashboardView,
} from "@/components/dashboard-sidebar";
import {
  DashboardOverview,
  DashboardReportView,
} from "@/components/dashboard-overview";
import {
  ReportsProvider,
  useReportsContext,
} from "@/components/reports-provider";

function DashboardBody() {
  const { configured, error, loading } = useReportsContext();
  const [activeView, setActiveView] = useState<DashboardView>("overview");

  if (!configured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f4f0] p-6 font-sans">
        <div className="max-w-lg rounded-[2rem] border border-dashed border-zinc-300 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-medium text-zinc-900">
            Actual Budget not configured
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Set ACTUAL_SERVER_URL, ACTUAL_SERVER_PASSWORD, and ACTUAL_SYNC_ID in
            your <code className="rounded bg-zinc-100 px-1">.env</code> file,
            then restart the app.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen gap-4 bg-[#f6f4f0] p-4 font-sans md:gap-6 md:p-6">
      <DashboardSidebar active={activeView} onNavigate={setActiveView} />
      <main className="min-w-0 flex-1">
        {error ? (
          <div
            className="mb-4 rounded-[2rem] bg-white p-4 text-sm text-rose-600 shadow-sm"
            role="alert"
          >
            {error}
          </div>
        ) : null}
        {loading ? (
          <p className="text-sm text-zinc-500">Connecting to Actual Budget…</p>
        ) : activeView === "overview" ? (
          <DashboardOverview />
        ) : (
          <DashboardReportView view={activeView} />
        )}
      </main>
    </div>
  );
}

export function Dashboard() {
  return (
    <ReportsProvider>
      <DashboardBody />
    </ReportsProvider>
  );
}
