import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getEvents, KIND_LABEL, type AgentEvent } from "@/lib/events";
import { getStatus } from "@/lib/status";
import { getRevenue } from "@/lib/revenue";
import { getGoals } from "@/lib/goals";
import type { Capability } from "@/lib/status";
import type { RevenueFigure } from "@/lib/revenue";
import type { Goal } from "@/lib/goals";

export const dynamic = "force-dynamic";

const MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";

interface Ctx {
  events: AgentEvent[];
  status: Capability[];
  revenue: RevenueFigure;
  goals: Goal[];
}

// Fast, provably-accurate paths for questions ABOUT this deployment's own
// data — answered straight from KV, no model call, can't hallucinate.
// Returns null when the question isn't one of these, so the caller falls
// through to the real model instead of guessing.
function answerFromData(question: string, ctx: Ctx): string | null {
  const q = question.toLowerCase();
  const { events, status, revenue, goals } = ctx;

  if (/(flag|block|problem|issue|wrong|mistake)/.test(q)) {
    const flagged = events.filter((e) => e.status !== "ok").slice(0, 5);
    if (!flagged.length) return "Nothing flagged or blocked in the current feed.";
    return flagged
      .map((e) => `[${e.status}] ${e.title} — ${e.detail || "no detail"} (${e.agent})`)
      .join("\n");
  }

  if (/(revenue|how much money|\$|income)/.test(q)) {
    if (revenue.isDemo || revenue.amountCents === null) {
      return `No revenue figure connected yet. ${revenue.note}`;
    }
    const amount = (revenue.amountCents / 100).toLocaleString(undefined, {
      style: "currency",
      currency: revenue.currency,
    });
    return `${amount} (${revenue.note || "source not noted"}), updated ${new Date(revenue.updatedAt).toISOString()}.`;
  }

  if (/(capabilit|is (the )?(terminal|browser|email|phone|bank|cards?) (on|online|working))/.test(q)) {
    return status.map((c) => `${c.label}: ${c.state} — ${c.detail}`).join("\n");
  }

  if (/goal/.test(q)) {
    const done = goals.filter((g) => g.done).length;
    return `${done}/${goals.length} goals done.\n` + goals.map((g) => `[${g.done ? "x" : " "}] ${g.label}`).join("\n");
  }

  if (/(last event|what just happened|recent activity)/.test(q)) {
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

  return null;
}

function buildSystemPrompt(ctx: Ctx): string {
  const { events, status, revenue, goals } = ctx;
  const flaggedCount = events.filter((e) => e.status !== "ok").length;
  const doneGoals = goals.filter((g) => g.done).length;
  const statusLine = status.map((c) => `${c.label}=${c.state}`).join(", ");
  const revenueLine =
    revenue.isDemo || revenue.amountCents === null
      ? "not connected yet"
      : `${(revenue.amountCents / 100).toLocaleString(undefined, { style: "currency", currency: revenue.currency })}`;

  return [
    "You are the Overseer on ipop.ai, a real oversight dashboard for autonomous AI agent work.",
    "",
    "What you can actually do:",
    "- Answer questions about this deployment's real live data (below).",
    "- Draft text on request — emails, outlines, summaries, ideas — using your own general knowledge.",
    "- Have a plain, honest conversation about what ipop is.",
    "",
    "What you CANNOT do — say so plainly if asked, don't pretend otherwise:",
    "- No live internet access or browsing. You cannot look up real, current information (e.g. real competitors, today's news, a live webpage). If asked for that, say you don't have live web access yet, then offer what you CAN do instead (e.g. draft something from what they tell you).",
    "- You cannot send emails or messages, make purchases, or hire anyone. You only produce text in this chat.",
    "",
    "Live data on this deployment right now:",
    `- Recent events: ${events.length} total, ${flaggedCount} flagged/blocked.`,
    `- Capability status: ${statusLine || "none reported"}.`,
    `- Revenue: ${revenueLine}.`,
    `- Goals: ${doneGoals}/${goals.length} done.`,
    "",
    "Answer briefly and plainly, like a helpful person, not a corporate bot. Never claim to have done something you haven't actually done in this response.",
  ].join("\n");
}

async function answerWithModel(question: string, ctx: Ctx): Promise<string> {
  const { env } = await getCloudflareContext({ async: true });
  try {
    const result = await env.AI.run(MODEL, {
      messages: [
        { role: "system", content: buildSystemPrompt(ctx) },
        { role: "user", content: question },
      ],
      max_tokens: 400,
    });
    const text = (result as { response?: string })?.response;
    return text?.trim() || "I didn't get a usable response from the model — try rephrasing.";
  } catch (err) {
    return `The model call failed (${err instanceof Error ? err.message : "unknown error"}) — the rest of the dashboard is unaffected, this is just the free-form chat.`;
  }
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

  const [events, status, revenue, goals] = await Promise.all([
    getEvents(),
    getStatus(),
    getRevenue(),
    getGoals(),
  ]);
  const ctx: Ctx = { events, status, revenue, goals };

  const fast = answerFromData(message, ctx);
  const reply = fast !== null ? fast : await answerWithModel(message, ctx);
  return NextResponse.json({ reply, source: fast !== null ? "data" : "model" });
}
