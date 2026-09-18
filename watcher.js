// Real autonomous background task — runs on a Cron Trigger (see wrangler.jsonc
// "triggers.crons"), not on a visitor's request. Checks NousResearch/hermes-agent
// for a genuinely new commit and, if one landed, pushes a real event onto the
// live feed. Silent when nothing changed (matches the feed's no-noise convention).
// Uses the raw `env` Cloudflare passes to scheduled handlers directly — this runs
// outside the Next.js/OpenNext request pipeline, so getCloudflareContext() (which
// depends on that pipeline) isn't available here.

const EVENTS_KEY = "events";
const WATCHER_STATE_KEY = "watcher_state";

export async function runWatcher(env) {
  try {
    const res = await fetch(
      "https://api.github.com/repos/NousResearch/hermes-agent/commits?per_page=1",
      { headers: { "user-agent": "ipop-watcher", accept: "application/vnd.github+json" } }
    );
    if (!res.ok) {
      await pushWatcherEvent(env, {
        status: "flagged",
        title: "Watcher check failed",
        detail: `GitHub API returned ${res.status}`,
      });
      return;
    }
    const commits = await res.json();
    const latest = Array.isArray(commits) ? commits[0] : null;
    if (!latest || !latest.sha) return;

    const stateRaw = await env.IPOP_KV.get(WATCHER_STATE_KEY);
    const state = stateRaw ? JSON.parse(stateRaw) : null;

    if (state && state.lastSha === latest.sha) {
      return; // nothing new — stay silent
    }

    await env.IPOP_KV.put(
      WATCHER_STATE_KEY,
      JSON.stringify({ lastSha: latest.sha, checkedAt: Date.now() })
    );

    // First run only seeds state (whatever HEAD happens to be isn't "new").
    if (state) {
      const message = ((latest.commit && latest.commit.message) || "").split("\n")[0].slice(0, 120);
      const author = (latest.commit && latest.commit.author && latest.commit.author.name) || "unknown";
      await pushWatcherEvent(env, {
        status: "ok",
        title: `New commit on NousResearch/hermes-agent: ${message}`,
        detail: `${latest.sha.slice(0, 10)} by ${author}`,
      });
    }
  } catch (err) {
    await pushWatcherEvent(env, {
      status: "flagged",
      title: "Watcher check errored",
      detail: String((err && err.message) || err),
    });
  }
}

async function pushWatcherEvent(env, { status, title, detail }) {
  const raw = await env.IPOP_KV.get(EVENTS_KEY);
  const events = raw ? JSON.parse(raw) : [];
  const event = {
    id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    ts: Date.now(),
    kind: "watcher",
    status,
    title,
    detail,
    agent: "cron:watcher",
  };
  const next = [event, ...events].slice(0, 200);
  await env.IPOP_KV.put(EVENTS_KEY, JSON.stringify(next));
}
