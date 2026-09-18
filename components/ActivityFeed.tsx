"use client";

import { useEffect, useState } from "react";
import { KIND_LABEL, statusStyle, type AgentEvent } from "@/lib/events";

function timeAgo(ts: number, now: number): string {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export default function ActivityFeed({ initial }: { initial: AgentEvent[] }) {
  const [events, setEvents] = useState<AgentEvent[]>(initial);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/events?limit=50", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { events: AgentEvent[] };
        setEvents(data.events);
      } catch {
        // Bridge unreachable — keep showing the last known feed rather than clearing it.
      }
    }, 5000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, []);

  return (
    <div className="divide-y divide-panel-border">
      {events.map((e) => {
        const style = statusStyle(e.status);
        return (
          <div key={e.id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${style.dot} ${
                e.status !== "ok" ? "animate-pulse-dot" : ""
              }`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-sm font-medium text-foreground">{e.title}</span>
                <span className={`text-[11px] font-mono uppercase tracking-wide ${style.text}`}>
                  {style.label}
                </span>
              </div>
              {e.detail && <p className="mt-0.5 text-sm text-muted break-words">{e.detail}</p>}
              <div className="mt-1 flex flex-wrap gap-x-2 text-[11px] font-mono text-muted/80">
                <span>{KIND_LABEL[e.kind]}</span>
                <span aria-hidden>·</span>
                <span>{e.agent}</span>
                <span aria-hidden>·</span>
                <span>{timeAgo(e.ts, now)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
