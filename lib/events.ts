export type EventKind =
  | "triage"
  | "oversight_review"
  | "outreach_gate"
  | "heartbeat"
  | "finance";

export type EventStatus = "ok" | "flagged" | "blocked";

export interface AgentEvent {
  id: string;
  ts: number;
  kind: EventKind;
  status: EventStatus;
  title: string;
  detail: string;
  agent: string;
}

export const KIND_LABEL: Record<EventKind, string> = {
  triage: "Triage gate",
  oversight_review: "Oversight review",
  outreach_gate: "Outreach guardrail",
  heartbeat: "Verified scheduling",
  finance: "Spend reconciliation",
};

const STATUS_STYLE: Record<EventStatus, { dot: string; text: string; label: string }> = {
  ok: { dot: "bg-accent", text: "text-accent", label: "ok" },
  flagged: { dot: "bg-warn", text: "text-warn", label: "flagged" },
  blocked: { dot: "bg-danger", text: "text-danger", label: "blocked" },
};

export function statusStyle(status: EventStatus) {
  return STATUS_STYLE[status];
}

let seq = 0;
function id() {
  seq += 1;
  return `evt_${Date.now().toString(36)}_${seq}`;
}

// Seed history so the feed isn't empty before any real agent has pushed to /api/events.
// Mirrors the actual guardrails shipped in hermes-agent: cheap triage classifier,
// oversight-review pattern registry, outreach verified-directory + dedupe ledger,
// verified-scheduling heartbeat, and decimal-reconciliation.
export function seedEvents(now: number): AgentEvent[] {
  const minutesAgo = (m: number) => now - m * 60_000;
  const events: AgentEvent[] = [
    {
      id: id(),
      ts: minutesAgo(2),
      kind: "heartbeat",
      status: "ok",
      title: "oversight-review fired on schedule",
      detail: "4 real executions checked, worst gap 61s (limit 90s @ 1.5x margin)",
      agent: "cron:oversight-review",
    },
    {
      id: id(),
      ts: minutesAgo(6),
      kind: "outreach_gate",
      status: "blocked",
      title: "Duplicate send excluded from campaign q3-dealers",
      detail: "whatsapp:+91••••4821 already received this content hash — resend refused",
      agent: "tools:outreach_safety",
    },
    {
      id: id(),
      ts: minutesAgo(11),
      kind: "triage",
      status: "ok",
      title: "Monitor change suppressed — not worth a run",
      detail: "p=0.18 vs threshold 0.70 on job 'competitor-pricing-watch'",
      agent: "tools:triage.cheap_classifier",
    },
    {
      id: id(),
      ts: minutesAgo(18),
      kind: "finance",
      status: "ok",
      title: "Reconciliation closed: invoice #4471",
      detail: "Decimal-exact, 3 assumptions logged, hash a91f…3c",
      agent: "hermes_cli.finance.decimal_reconciliation",
    },
    {
      id: id(),
      ts: minutesAgo(27),
      kind: "oversight_review",
      status: "flagged",
      title: "Unbacked revenue claim on task #1182",
      detail: "\"sale confirmed\" with no attached receipt — commented, not closed",
      agent: "cron:oversight_review",
    },
    {
      id: id(),
      ts: minutesAgo(41),
      kind: "outreach_gate",
      status: "ok",
      title: "Precheck cleared 34/40 targets for campaign q3-dealers",
      detail: "6 excluded: unverified directory source",
      agent: "tools:outreach_precheck",
    },
    {
      id: id(),
      ts: minutesAgo(58),
      kind: "oversight_review",
      status: "ok",
      title: "Swept 12 tasks in review — nothing flagged",
      detail: "Pattern registry: revenue claims, spend pre-auth, outreach gate record",
      agent: "cron:oversight_review",
    },
  ];
  return events.sort((a, b) => b.ts - a.ts);
}

// Durable KV-backed store (survives redeploys/cold starts) — one JSON array
// under a single key, bounded to the most recent 200 events. Small enough at
// this scale that a single key is simpler and more consistent than KV's
// eventually-consistent list() API.
import { kvGetJSON, kvSetJSON } from "./cf";

const KV_KEY = "events";

export async function getEvents(): Promise<AgentEvent[]> {
  const events = await kvGetJSON<AgentEvent[] | null>(KV_KEY, null);
  if (events) return events;
  const seeded = seedEvents(Date.now());
  await kvSetJSON(KV_KEY, seeded);
  return seeded;
}

export async function pushEvent(input: Omit<AgentEvent, "id" | "ts">): Promise<AgentEvent> {
  const events = await getEvents();
  const event: AgentEvent = { ...input, id: id(), ts: Date.now() };
  const next = [event, ...events].slice(0, 200);
  await kvSetJSON(KV_KEY, next);
  return event;
}
