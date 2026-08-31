"use client";

import { useState } from "react";

import {
  accounts,
  gbp,
  kpis,
  netWorth,
  pct,
  prototypeState,
  reports,
  spending,
} from "@/components/prototype/mock-data";
import { Bars, Spark } from "@/components/prototype/spark";

export const VariantCockpitName = "Cockpit";

export function VariantCockpit() {
  const [active, setActive] = useState("net-worth");

  return (
    <div className="prototype-cockpit flex min-h-screen bg-[#071018] text-[#d7ece6]">
      <aside className="flex w-64 shrink-0 flex-col border-r border-white/8 bg-[#0b1820] px-4 py-5">
        <p className="px-2 font-mono text-[10px] tracking-[0.3em] text-teal-400 uppercase">
          ABR // 0.1
        </p>
        <h1 className="mt-3 px-2 text-lg font-semibold">Reports</h1>
        <nav className="mt-6 flex flex-col gap-1">
          {reports.map((report) => (
            <button
              key={report.id}
              type="button"
              onClick={() => setActive(report.id)}
              className={`rounded-md px-3 py-2 text-left text-sm ${
                active === report.id
                  ? "bg-teal-400 text-[#071018]"
                  : "text-white/70 hover:bg-white/5"
              }`}
            >
              {report.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto space-y-2 px-2 pt-8 text-xs text-white/50">
          <p>Preset</p>
          <p className="font-mono text-teal-300">{prototypeState.preset}</p>
          <p className="pt-3">Excluded</p>
          {prototypeState.excluded.map((name) => (
            <p key={name} className="font-mono">
              − {name}
            </p>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="grid grid-cols-4 border-b border-white/8">
          {[
            ["Net worth", gbp(kpis.netWorth), pct(kpis.netWorthDelta)],
            ["Liquid", gbp(kpis.liquid), "+£420"],
            ["Spent", gbp(kpis.spentThisMonth), "−8% vs Jul"],
            ["Income", gbp(kpis.incomeThisMonth), "on track"],
          ].map(([label, value, delta]) => (
            <div
              key={label}
              className="border-r border-white/8 px-5 py-4 last:border-r-0"
            >
              <p className="font-mono text-[10px] tracking-widest text-white/40 uppercase">
                {label}
              </p>
              <p className="mt-1 font-mono text-2xl text-white">{value}</p>
              <p className="mt-1 text-xs text-teal-300">{delta}</p>
            </div>
          ))}
        </div>

        <main className="grid min-h-0 flex-1 lg:grid-cols-[1.4fr_0.8fr]">
          <section className="border-r border-white/8 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-mono text-sm tracking-widest uppercase">
                {reports.find((report) => report.id === active)?.label}
              </h2>
              <span className="rounded border border-teal-400/40 px-2 py-0.5 font-mono text-[10px] text-teal-300">
                LIVE
              </span>
            </div>
            <div className="h-56 rounded-lg border border-white/8 bg-[#0b1820] p-4">
              <Spark
                points={netWorth}
                color="#2dd4bf"
                fill="rgba(45,212,191,0.12)"
                height={200}
              />
            </div>
            <div className="mt-6">
              <h3 className="mb-3 font-mono text-[10px] tracking-widest text-white/40 uppercase">
                Category burn
              </h3>
              <Bars items={spending} color="#2dd4bf" />
            </div>
          </section>

          <section className="p-6">
            <h3 className="mb-4 font-mono text-[10px] tracking-widest text-white/40 uppercase">
              Positions
            </h3>
            <ul className="space-y-3">
              {accounts.map((account) => (
                <li
                  key={account.name}
                  className="flex items-center justify-between rounded-md border border-white/8 px-3 py-3"
                >
                  <div>
                    <p className="text-sm">{account.name}</p>
                    <p className="font-mono text-[10px] text-white/35 uppercase">
                      {account.kind}
                    </p>
                  </div>
                  <p
                    className={`font-mono ${
                      account.balance < 0 ? "text-rose-300" : "text-white"
                    }`}
                  >
                    {gbp(account.balance)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </main>

        <footer className="flex items-center justify-between border-t border-white/8 px-5 py-2 font-mono text-[10px] text-white/40">
          <span>SYNC {prototypeState.syncedAt.toUpperCase()}</span>
          <span>TTL 5M · MANUAL REFRESH AVAILABLE</span>
        </footer>
      </div>
    </div>
  );
}
