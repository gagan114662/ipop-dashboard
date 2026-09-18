"use client";

import { useEffect, useState } from "react";
import type { RevenueFigure } from "@/lib/revenue";

export default function RevenueTile({ initial }: { initial: RevenueFigure }) {
  const [revenue, setRevenue] = useState<RevenueFigure>(initial);

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/revenue", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { revenue: RevenueFigure };
        setRevenue(data.revenue);
      } catch {
        // keep showing last known figure
      }
    }, 10000);
    return () => clearInterval(poll);
  }, []);

  const display =
    revenue.isDemo || revenue.amountCents === null
      ? "—"
      : (revenue.amountCents / 100).toLocaleString(undefined, {
          style: "currency",
          currency: revenue.currency,
          maximumFractionDigits: 0,
        });

  return (
    <div className="rounded-2xl border border-panel-border bg-panel p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Revenue this month</span>
        {(revenue.isDemo || revenue.amountCents === null) && (
          <span className="rounded-full border border-panel-border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide text-muted">
            not connected
          </span>
        )}
      </div>
      <div className="mt-3 font-mono text-3xl text-foreground sm:text-4xl">{display}</div>
      <p className="mt-2 text-xs text-muted">{revenue.note}</p>
    </div>
  );
}
