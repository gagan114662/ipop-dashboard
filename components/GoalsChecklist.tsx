"use client";

import { useEffect, useState } from "react";
import type { Goal } from "@/lib/goals";

export default function GoalsChecklist({ initial }: { initial: Goal[] }) {
  const [goals, setGoals] = useState<Goal[]>(initial);

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/goals", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { goals: Goal[] };
        setGoals(data.goals);
      } catch {
        // keep showing last known goals
      }
    }, 8000);
    return () => clearInterval(poll);
  }, []);

  const done = goals.filter((g) => g.done).length;

  return (
    <div className="rounded-2xl border border-panel-border bg-panel p-6">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Goals</span>
        <span className="font-mono text-xs text-muted">{done}/{goals.length}</span>
      </div>
      <ul className="mt-4 space-y-3">
        {goals.map((g) => (
          <li key={g.id} className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                g.done ? "border-accent bg-accent-dim text-accent" : "border-panel-border text-muted"
              }`}
              aria-hidden
            >
              {g.done ? "✓" : ""}
            </span>
            <div>
              <div className={`text-sm ${g.done ? "text-foreground" : "text-muted"}`}>{g.label}</div>
              {g.detail && (
                <details className="mt-0.5">
                  <summary className="cursor-pointer select-none text-[11px] text-muted/60 hover:text-muted">
                    the techy bit
                  </summary>
                  <div className="mt-1 font-mono text-[11px] text-muted/80">{g.detail}</div>
                </details>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
