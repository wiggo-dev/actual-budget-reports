"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useReportsContext } from "@/components/reports-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/format";
import { parseJsonResponse } from "@/lib/api-client";

export type TransactionDrilldownFilter = {
  title: string;
  payeeId?: string;
  payee?: string;
  category?: string;
  month?: string;
  /** Which timeframe query to use when month is not set. */
  scope?: "spending" | "trend";
};

type TransactionRow = {
  id: string;
  date: string;
  payee: string;
  category: string;
  account: string;
  amount: number;
};

type DrilldownContextValue = {
  openDrilldown: (filter: TransactionDrilldownFilter) => void;
};

const DrilldownContext = createContext<DrilldownContextValue | null>(null);

export function useTransactionDrilldown() {
  const context = useContext(DrilldownContext);
  if (!context) {
    throw new Error(
      "useTransactionDrilldown must be used within TransactionDrilldownProvider"
    );
  }
  return context;
}

export function useOptionalTransactionDrilldown() {
  return useContext(DrilldownContext);
}

export function TransactionDrilldownProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { queryStringFor, currency } = useReportsContext();
  const [filter, setFilter] = useState<TransactionDrilldownFilter | null>(null);
  const [rows, setRows] = useState<TransactionRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDrilldown = useCallback((next: TransactionDrilldownFilter) => {
    setRows(null);
    setError(null);
    setLoading(true);
    setFilter(next);
  }, []);

  const closeDrilldown = useCallback(() => {
    setFilter(null);
    setRows(null);
    setError(null);
    setLoading(false);
  }, []);

  const value = useMemo(() => ({ openDrilldown }), [openDrilldown]);

  useEffect(() => {
    if (!filter) {
      return;
    }

    let cancelled = false;
    const activeFilter = filter;

    async function load() {
      try {
        const scope = activeFilter.month
          ? "trend"
          : (activeFilter.scope ?? "spending");
        const base = new URLSearchParams(
          queryStringFor(scope).replace(/^\?/, "")
        );
        if (activeFilter.payeeId) base.set("payeeId", activeFilter.payeeId);
        if (activeFilter.payee) base.set("payee", activeFilter.payee);
        if (activeFilter.category) base.set("category", activeFilter.category);
        if (activeFilter.month) base.set("month", activeFilter.month);

        const response = await fetch(
          `/api/reports/transactions?${base.toString()}`
        );
        const payload = await parseJsonResponse<{
          data: TransactionRow[];
          error?: string;
        }>(response);
        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load transactions");
        }
        if (!cancelled) {
          setRows(payload.data as TransactionRow[]);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load transactions"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [filter, queryStringFor]);

  const money = (amount: number) => formatMoney(amount, currency);

  return (
    <DrilldownContext.Provider value={value}>
      {children}
      <Dialog
        open={filter != null}
        onOpenChange={(open) => {
          if (!open) {
            closeDrilldown();
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{filter?.title ?? "Transactions"}</DialogTitle>
            <DialogDescription>
              Underlying transactions for this slice.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-auto">
            {loading ? (
              <p className="text-sm text-zinc-500">Loading transactions…</p>
            ) : null}
            {error ? (
              <p className="text-sm text-rose-600" role="alert">
                {error}
              </p>
            ) : null}
            {!loading && !error && rows?.length === 0 ? (
              <p className="text-sm text-zinc-500">No transactions found.</p>
            ) : null}
            {!loading && !error && rows && rows.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white text-xs tracking-wide text-zinc-500 uppercase">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Date</th>
                    <th className="py-2 pr-3 font-medium">Payee</th>
                    <th className="py-2 pr-3 font-medium">Category</th>
                    <th className="py-2 pr-3 font-medium">Account</th>
                    <th className="py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-zinc-100">
                      <td className="py-2 pr-3 tabular-nums text-zinc-600">
                        {row.date}
                      </td>
                      <td className="py-2 pr-3 text-zinc-900">{row.payee}</td>
                      <td className="py-2 pr-3 text-zinc-600">
                        {row.category}
                      </td>
                      <td className="py-2 pr-3 text-zinc-600">{row.account}</td>
                      <td
                        className={`py-2 text-right font-medium tabular-nums ${
                          row.amount < 0 ? "text-rose-700" : "text-emerald-700"
                        }`}
                      >
                        {money(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </DrilldownContext.Provider>
  );
}
