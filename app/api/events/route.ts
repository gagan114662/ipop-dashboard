import { NextRequest, NextResponse } from "next/server";
import { getEvents, pushEvent, type EventKind, type EventStatus } from "@/lib/events";

export const dynamic = "force-dynamic";

const KINDS: EventKind[] = ["triage", "oversight_review", "outreach_gate", "heartbeat", "finance"];
const STATUSES: EventStatus[] = ["ok", "flagged", "blocked"];

// GET returns the current feed (newest first). POST is "the bridge": any agent
// (e.g. the hermes-agent oversight-review job) can push a real event here.
// Demo-tier: in-memory, unauthenticated, single-instance. A production bridge
// needs a per-source ingest token and durable storage before real agents write to it.
export async function GET(req: NextRequest) {
  const limit = Math.max(1, Math.min(200, Number(req.nextUrl.searchParams.get("limit")) || 50));
  return NextResponse.json({ events: getEvents().slice(0, limit) });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body must be JSON" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "body must be a JSON object" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const kind = b.kind;
  const status = b.status;
  const title = b.title;
  if (typeof kind !== "string" || !KINDS.includes(kind as EventKind)) {
    return NextResponse.json({ error: `kind must be one of ${KINDS.join(", ")}` }, { status: 400 });
  }
  if (typeof status !== "string" || !STATUSES.includes(status as EventStatus)) {
    return NextResponse.json({ error: `status must be one of ${STATUSES.join(", ")}` }, { status: 400 });
  }
  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  const event = pushEvent({
    kind: kind as EventKind,
    status: status as EventStatus,
    title: title.trim(),
    detail: typeof b.detail === "string" ? b.detail : "",
    agent: typeof b.agent === "string" && b.agent.trim() ? b.agent.trim() : "unknown",
  });
  return NextResponse.json({ event }, { status: 201 });
}
