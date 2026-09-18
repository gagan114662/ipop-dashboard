import { NextRequest, NextResponse } from "next/server";
import { getEvents, KIND_LABEL } from "@/lib/events";
import { getStatus } from "@/lib/status";
import { getRevenue } from "@/lib/revenue";
import { GOALS } from "@/lib/goals";

export const dynamic = "force-dynamic";

// Grounded responder over real bridge data — NOT an LLM. It answers by reading
// the same KV-backed events/status/revenue/goals this dashboard renders, so it
// never states something as fact that isn't actually in the store. Wiring a
// real model behind this is a deliberate follow-up, not done here, since it
// needs a provider/key decision this deployment hasn't been given.
function summarize(question: string, ctx: {
  events: Awaited<ReturnType<typeof getEvents>>;
  status: Awaited<ReturnType<typeof getStatus>>;
  revenue: Awaited<ReturnType<typeof getRevenue>>;
}): string {
  const q = question.toLowerCase();
  const { events, status, revenue } = ctx;

  if (/(flag|block|problem|issue|wrong|mistake)/.test(q)) {
    const flagged = events.filter((e) => e.status !== "ok").slice(0, 5);
    if (!flagged.length) return "Nothing flagged or blocked in the current feed.";
    return flagged
      .map((e) => `[${e.status}] ${e.title} — ${e.detail || "no detail"} (${e.agent})`)
      .join("\n");
  }

  if (/(revenue|money|spend|\$|income)/.test(q)) {
    if (revenue.isDemo || revenue.amountCents === null) {
      return `No revenue figure connected yet. ${revenue.note}`;
    }
    const amount = (revenue.amountCents / 100).toLocaleString(undefined, {
      style: "currency",
      currency: revenue.currency,
    });
    return `${amount} (${revenue.note || "source not noted"}), updated ${new Date(revenue.updatedAt).toISOString()}.`;
  }

  if (/(status|working|online|capabilit|terminal|browser|phone|bank|card)/.test(q)) {
    return status.map((c) => `${c.label}: ${c.state} — ${c.detail}`).join("\n");
  }

  if (/goal/.test(q)) {
    const done = GOALS.filter((g) => g.done).length;
    return `${done}/${GOALS.length} goals done.\n` + GOALS.map((g) => `[${g.done ? "x" : " "}] ${g.label}`).join("\n");
  }

  if (!events.length) return "No agent activity recorded yet.";
  const last = events[0];
  const counts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1;
    return acc;
  }, {});
  return (
    `Last event: [${last.status}] ${last.title} (${KIND_LABEL[last.kind]}, ${last.agent}).\n` +
    `Across the last ${events.length}: ${counts.ok || 0} ok, ${counts.flagged || 0} flagged, ${counts.blocked || 0} blocked.`
  );
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body must be JSON" }, { status: 400 });
  }
  const message = typeof (body as Record<string, unknown>)?.message === "string"
    ? ((body as Record<string, unknown>).message as string)
    : "";
  if (!message.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const [events, status, revenue] = await Promise.all([getEvents(), getStatus(), getRevenue()]);
  const reply = summarize(message, { events, status, revenue });
  return NextResponse.json({ reply });
}
