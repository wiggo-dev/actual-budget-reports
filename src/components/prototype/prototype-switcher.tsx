"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

export const PROTOTYPE_VARIANTS = [
  { key: "A", name: "Current" },
  { key: "B", name: "Ledger" },
  { key: "C", name: "Cockpit" },
  { key: "D", name: "Bento" },
] as const;

export type PrototypeVariant = (typeof PROTOTYPE_VARIANTS)[number]["key"];

export function PrototypeSwitcher() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = (searchParams.get("variant") ?? "A") as PrototypeVariant;
  const index = Math.max(
    0,
    PROTOTYPE_VARIANTS.findIndex((item) => item.key === current)
  );
  const label = PROTOTYPE_VARIANTS[index];

  const go = useCallback(
    (nextIndex: number) => {
      const wrapped =
        (nextIndex + PROTOTYPE_VARIANTS.length) % PROTOTYPE_VARIANTS.length;
      const next = PROTOTYPE_VARIANTS[wrapped];
      const params = new URLSearchParams(searchParams.toString());
      params.set("variant", next.key);
      router.replace(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "ArrowLeft") {
        go(index - 1);
      }
      if (event.key === "ArrowRight") {
        go(index + 1);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-zinc-950 px-2 py-1.5 text-white shadow-2xl">
        <button
          type="button"
          className="size-8 rounded-full text-lg leading-none hover:bg-white/10"
          onClick={() => go(index - 1)}
          aria-label="Previous variant"
        >
          ←
        </button>
        <div className="min-w-40 px-2 text-center text-sm font-medium tabular-nums">
          {label.key} ({label.name})
        </div>
        <button
          type="button"
          className="size-8 rounded-full text-lg leading-none hover:bg-white/10"
          onClick={() => go(index + 1)}
          aria-label="Next variant"
        >
          →
        </button>
      </div>
    </div>
  );
}
