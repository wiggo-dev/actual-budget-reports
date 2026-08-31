"use client";

// Three variants of the dashboard, switchable via ?variant=, on the existing `/` route.

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Dashboard } from "@/components/dashboard";
import { PrototypeSwitcher } from "@/components/prototype/prototype-switcher";
import { VariantBento } from "@/components/prototype/variant-bento";
import { VariantCockpit } from "@/components/prototype/variant-cockpit";
import { VariantLedger } from "@/components/prototype/variant-ledger";

import "./prototype.css";

function PrototypeFrame() {
  const searchParams = useSearchParams();
  const variant = searchParams.get("variant") ?? "A";

  return (
    <>
      {variant === "A" ? <Dashboard /> : null}
      {variant === "B" ? <VariantLedger /> : null}
      {variant === "C" ? <VariantCockpit /> : null}
      {variant === "D" ? <VariantBento /> : null}
      <PrototypeSwitcher />
      <p className="sr-only">
        Prototype state: variant={variant}; mock data only on B–D
      </p>
    </>
  );
}

export function DashboardPrototype() {
  return (
    <Suspense fallback={null}>
      <PrototypeFrame />
    </Suspense>
  );
}
