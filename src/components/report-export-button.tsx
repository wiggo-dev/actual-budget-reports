"use client";

import { Download } from "lucide-react";
import { useState } from "react";

import { useReportsContext } from "@/components/reports-provider";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/export-csv";
import type { DashboardView } from "@/lib/dashboard-views";
import { buildReportCsvExport } from "@/lib/report-export";

type ExportableView = Exclude<DashboardView, "overview">;

export function ReportExportButton({ view }: { view: ExportableView }) {
  const { queryStringFor, trendTimeframe, spendingTimeframe } =
    useReportsContext();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    setError(null);

    try {
      const { filename, content } = await buildReportCsvExport(
        view,
        queryStringFor,
        trendTimeframe,
        spendingTimeframe
      );
      downloadCsv(filename, content);
    } catch (exportError) {
      setError(
        exportError instanceof Error ? exportError.message : "Export failed"
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-xl"
        disabled={exporting}
        onClick={() => void handleExport()}
      >
        <Download className="size-4" />
        {exporting ? "Exporting…" : "Export CSV"}
      </Button>
      {error ? (
        <p className="max-w-xs text-right text-xs text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
