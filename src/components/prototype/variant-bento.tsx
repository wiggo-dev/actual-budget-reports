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
import { Spark } from "@/components/prototype/spark";

export const VariantBentoName = "Bento";

export function VariantBento() {
  return (
    <div className="prototype-bento min-h-screen bg-[#f6f4f0] p-4 text-zinc-900 md:p-6">
      <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-6 md:grid-rows-[auto_auto_auto]">
        <div className="relative overflow-hidden rounded-[2rem] bg-linear-to-br from-emerald-700 via-teal-700 to-stone-900 p-8 text-white md:col-span-4 md:row-span-2">
          <p className="text-sm text-white/70">Liquid net worth</p>
          <p className="mt-2 text-6xl font-semibold tracking-tight md:text-7xl">
            {gbp(kpis.netWorth)}
          </p>
          <p className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-sm">
            {pct(kpis.netWorthDelta)} this year
          </p>
          <div className="mt-10 h-36 opacity-90">
            <Spark
              points={netWorth}
              color="#ecfccb"
              fill="rgba(236,252,203,0.18)"
            />
          </div>
          <p className="mt-6 max-w-sm text-sm text-white/70">
            Mortgage excluded. Switch presets from the chip row if you want the
            full household picture.
          </p>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm md:col-span-2">
          <p className="text-sm text-zinc-500">This month</p>
          <p className="mt-2 text-3xl font-semibold">
            {gbp(kpis.spentThisMonth)}
          </p>
          <p className="text-sm text-zinc-500">
            spent of {gbp(kpis.incomeThisMonth)}
          </p>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full w-[57%] rounded-full bg-amber-400" />
          </div>
          <p className="mt-2 text-xs text-zinc-400">57% of income used</p>
        </div>

        <div className="rounded-[2rem] bg-[#1a1814] p-6 text-[#f4efe6] md:col-span-2">
          <p className="text-sm text-white/50">Preset</p>
          <p className="mt-2 text-2xl font-medium">{prototypeState.preset}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["All accounts", "Liquid", "Investments"].map((name, index) => (
              <span
                key={name}
                className={`rounded-full px-3 py-1 text-xs ${
                  index === 1 ? "bg-lime-300 text-zinc-900" : "bg-white/10"
                }`}
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm md:col-span-3">
          <p className="mb-4 text-sm text-zinc-500">Spending mix</p>
          <div className="flex flex-wrap gap-2">
            {spending.map((item, index) => {
              const palette = [
                "bg-emerald-200",
                "bg-amber-200",
                "bg-sky-200",
                "bg-rose-200",
                "bg-violet-200",
              ];
              return (
                <span
                  key={item.name}
                  className={`rounded-full px-4 py-2 text-sm ${palette[index]}`}
                >
                  {item.name} · {gbp(item.amount)}
                </span>
              );
            })}
          </div>
        </div>

        <div className="rounded-[2rem] bg-lime-200 p-6 md:col-span-3">
          <p className="mb-4 text-sm text-emerald-900/70">Cash flow</p>
          <div className="flex h-28 items-end gap-3">
            {cashFlow.map((row) => (
              <div
                key={row.month}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div className="flex w-full items-end justify-center gap-1">
                  <div
                    className="w-1/3 rounded-t-md bg-emerald-800"
                    style={{ height: `${(row.in / 6000) * 96}px` }}
                  />
                  <div
                    className="w-1/3 rounded-t-md bg-emerald-800/30"
                    style={{ height: `${(row.out / 6000) * 96}px` }}
                  />
                </div>
                <span className="text-[10px] uppercase">{row.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm md:col-span-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-zinc-500">Accounts</p>
            <p className="text-xs text-zinc-400">Tap to exclude</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-5">
            {accounts.map((account) => (
              <div
                key={account.name}
                className={`rounded-2xl px-4 py-4 ${
                  account.kind === "debt"
                    ? "bg-zinc-100 text-zinc-400 line-through"
                    : "bg-zinc-50"
                }`}
              >
                <p className="text-sm">{account.name}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {gbp(account.balance)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
