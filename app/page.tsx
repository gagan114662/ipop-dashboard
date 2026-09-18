import ActivityFeed from "@/components/ActivityFeed";
import StatusGrid from "@/components/StatusGrid";
import RevenueTile from "@/components/RevenueTile";
import GoalsChecklist from "@/components/GoalsChecklist";
import OverseerChat from "@/components/OverseerChat";
import { getEvents } from "@/lib/events";
import { getStatus } from "@/lib/status";
import { getRevenue } from "@/lib/revenue";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    n: "01",
    title: "You give direction",
    body: "Set the goal and the guardrails once — spend limits, verified-recipient sources, what counts as evidence.",
  },
  {
    n: "02",
    title: "An oversight agent watches, never executes",
    body: "It reviews completed work and flags anomalies — unbacked revenue claims, spend without pre-auth, outreach that skipped the safety gate. It never does the work itself.",
  },
  {
    n: "03",
    title: "Cheap gates filter the noise",
    body: "A calibrated triage classifier decides if a change is even worth a full agent turn before one is spent.",
  },
  {
    n: "04",
    title: "Every decision lands on the feed",
    body: "Triage calls, oversight flags, outreach blocks, reconciliations — pushed to the bridge in real time, not summarized after the fact.",
  },
];

const STATS = [
  { label: "Guardrails shipped", value: "5" },
  { label: "Money math", value: "Decimal-exact" },
  { label: "Outreach dedupe", value: "Ledger-backed" },
  { label: "Schedule proof", value: "History, not config" },
];

export default async function Home() {
  const [events, status, revenue] = await Promise.all([getEvents(), getStatus(), getRevenue()]);

  return (
    <div className="relative flex-1">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_100%)]" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse-dot" aria-hidden />
          <span className="font-mono text-sm tracking-widest text-foreground">IPOP</span>
        </div>
        <nav className="hidden gap-8 text-sm text-muted sm:flex">
          <a href="#dashboard" className="hover:text-foreground">Dashboard</a>
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#feed" className="hover:text-foreground">Live feed</a>
          <a href="#bridge" className="hover:text-foreground">The bridge</a>
        </nav>
        <a
          href="#bridge"
          className="rounded-full border border-panel-border bg-panel px-4 py-1.5 text-sm text-foreground hover:border-accent-dim"
        >
          Connect an agent
        </a>
      </header>

      <main className="relative mx-auto max-w-6xl px-6">
        <section className="py-20 sm:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            oversight for autonomous work
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-foreground sm:text-6xl">
            Let your agent run the business.
            <br />
            Let something else watch it.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            ipop is an oversight layer for agents that spend money, message people, and close
            work unattended — a triage gate, a spend reconciler, an outreach guardrail, and a
            review loop that flags mistakes instead of hiding them.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <a
              href="#dashboard"
              className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-[#04140b] hover:opacity-90"
            >
              Watch it live
            </a>
            <a
              href="#bridge"
              className="rounded-full border border-panel-border px-6 py-3 text-sm text-foreground hover:border-accent-dim"
            >
              Wire up the bridge
            </a>
          </div>
        </section>

        <section id="dashboard" className="pb-16">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <OverseerChat />
            <div className="flex flex-col gap-6">
              <RevenueTile initial={revenue} />
              <GoalsChecklist />
            </div>
          </div>
          <div className="mt-6">
            <StatusGrid initial={status} />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-panel-border bg-panel-border sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-panel px-5 py-6">
              <div className="font-mono text-xl text-foreground sm:text-2xl">{s.value}</div>
              <div className="mt-1 text-xs text-muted">{s.label}</div>
            </div>
          ))}
        </section>

        <section id="how" className="py-24 sm:py-32">
          <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-muted">How it works</h2>
          <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-panel-border bg-panel-border sm:grid-cols-2">
            {STEPS.map((step) => (
              <div key={step.n} className="bg-panel p-7">
                <div className="font-mono text-sm text-accent">{step.n}</div>
                <h3 className="mt-3 text-lg font-medium text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="feed" className="py-24 sm:py-32">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-muted">
              Live agent activity
            </h2>
            <span className="font-mono text-xs text-muted">polls every 5s</span>
          </div>
          <div className="mt-8 rounded-2xl border border-panel-border bg-panel p-6">
            <ActivityFeed initial={events} />
          </div>
        </section>

        <section id="bridge" className="py-24 sm:py-32">
          <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-muted">The bridge</h2>
          <p className="mt-4 max-w-2xl text-muted">
            Any agent can post a real decision onto this dashboard — events, capability status,
            revenue. Storage is durable (Cloudflare KV, survives redeploys). Writes require a
            bearer token (<code className="text-foreground">Authorization: Bearer &lt;token&gt;</code>,
            configured server-side as <code className="text-foreground">BRIDGE_TOKEN</code>) — reads
            stay public so the dashboard works without one.
          </p>
          <pre className="mt-6 overflow-x-auto rounded-2xl border border-panel-border bg-panel p-5 text-sm text-foreground">
            <code>{`curl -X POST https://ipop.ai/api/events \\
  -H "content-type: application/json" \\
  -H "authorization: Bearer $IPOP_BRIDGE_TOKEN" \\
  -d '{
    "kind": "outreach_gate",
    "status": "blocked",
    "title": "Duplicate send excluded",
    "detail": "Already sent under this campaign_id",
    "agent": "tools:outreach_safety"
  }'

curl -X POST https://ipop.ai/api/status \\
  -H "content-type: application/json" \\
  -H "authorization: Bearer $IPOP_BRIDGE_TOKEN" \\
  -d '{"key": "browser", "state": "working", "detail": "QA pass on ipop.ai"}'

curl -X POST https://ipop.ai/api/revenue \\
  -H "content-type: application/json" \\
  -H "authorization: Bearer $IPOP_BRIDGE_TOKEN" \\
  -d '{"amountCents": 128400, "currency": "USD", "note": "Stripe, MTD"}'`}</code>
          </pre>
        </section>
      </main>

      <footer className="relative mx-auto max-w-6xl px-6 py-10 text-xs text-muted">
        ipop — oversight for autonomous work.
      </footer>
    </div>
  );
}
