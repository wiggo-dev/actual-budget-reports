"use client";

import {
  accounts,
  cashFlow,
  gbp,
  kpis,
  netWorth,
  pct,
  prototypeState,
  spending,
} from "@/components/prototype/mock-data";
import { Bars, Spark } from "@/components/prototype/spark";

export const VariantLedgerName = "Ledger";

export function VariantLedger() {
  return (
    <div className="prototype-ledger min-h-screen bg-[#f3efe4] text-[#1c1914]">
      <header className="border-b border-[#1c1914]/12 px-8 py-6">
        <div className="mx-auto flex max-w-6xl items-end justify-between gap-6">
          <div>
            <p className="text-[0.7rem] tracking-[0.28em] uppercase">
              Household ledger
            </p>
            <h1 className="mt-2 font-serif text-5xl leading-none tracking-tight">
              August 2026
            </h1>
          </div>
          <div className="text-right text-sm">
            <p>Preset · {prototypeState.preset}</p>
            <p className="opacity-60">Synced {prototypeState.syncedAt}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-12 px-8 py-12 lg:grid-cols-[1.15fr_0.85fr]">
        <section>
          <p className="text-sm tracking-wide uppercase opacity-60">
            Net worth
          </p>
          <p className="mt-3 font-serif text-7xl leading-none tracking-tight">
            {gbp(kpis.netWorth)}
          </p>
          <p className="mt-4 max-w-md text-lg leading-relaxed">
            Up {pct(kpis.netWorthDelta)} this year. Mortgage and Help to Buy sit
            outside this figure — liquid and investments only.
          </p>
          <div className="mt-10 h-40">
            <Spark
              points={netWorth}
              color="#1c1914"
              fill="rgba(28,25,20,0.08)"
            />
          </div>
          <p className="mt-8 border-l-2 border-[#1c1914] pl-4 text-sm leading-relaxed">
            You spent {gbp(kpis.spentThisMonth)} this month against{" "}
            {gbp(kpis.incomeThisMonth)} in. Groceries remain the largest
            outflow; eating out is down versus July.
          </p>
        </section>

        <aside className="space-y-10">
          <div>
            <h2 className="mb-4 font-serif text-2xl">Accounts in view</h2>
            <table className="w-full text-sm">
              <tbody>
                {accounts
                  .filter((account) => account.kind !== "debt")
                  .map((account) => (
                    <tr
                      key={account.name}
                      className="border-b border-[#1c1914]/10"
                    >
                      <td className="py-3">{account.name}</td>
                      <td className="py-3 text-right font-serif text-lg tabular-nums">
                        {gbp(account.balance)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div>
            <h2 className="mb-4 font-serif text-2xl">This month</h2>
            <Bars items={spending} color="#1c1914" />
          </div>

          <div>
            <h2 className="mb-4 font-serif text-2xl">Cash flow</h2>
            <div className="grid grid-cols-6 gap-2 text-center text-xs">
              {cashFlow.map((row) => (
                <div key={row.month}>
                  <div className="flex h-24 items-end justify-center gap-1">
                    <div
                      className="w-2 bg-[#1c1914]"
                      style={{ height: `${(row.in / 6000) * 100}%` }}
                    />
                    <div
                      className="w-2 bg-[#1c1914]/30"
                      style={{ height: `${(row.out / 6000) * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 opacity-60">{row.month}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
