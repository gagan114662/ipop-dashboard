"use client";

import { useEffect, useState } from "react";
import type { Capability, CapabilityState } from "@/lib/status";

const STATE_STYLE: Record<CapabilityState, { dot: string; text: string }> = {
  idle: { dot: "bg-muted", text: "text-muted" },
  working: { dot: "bg-accent animate-pulse-dot", text: "text-accent" },
  offline: { dot: "bg-panel-border", text: "text-muted/60" },
};

export default function StatusGrid({ initial }: { initial: Capability[] }) {
  const [capabilities, setCapabilities] = useState<Capability[]>(initial);

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/status", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { capabilities: Capability[] };
        setCapabilities(data.capabilities);
      } catch {
        // keep showing last known state
      }
    }, 5000);
    return () => clearInterval(poll);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-panel-border bg-panel-border sm:grid-cols-3 lg:grid-cols-6">
      {capabilities.map((c) => {
        const style = STATE_STYLE[c.state];
        return (
          <div key={c.key} className="bg-panel p-5">
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden />
              <span className="text-sm font-medium text-foreground">{c.label}</span>
            </div>
            <div className={`mt-2 font-mono text-xs uppercase tracking-wide ${style.text}`}>{c.state}</div>
            <p className="mt-1 text-xs text-muted">{c.detail}</p>
          </div>
        );
      })}
    </div>
  );
}
