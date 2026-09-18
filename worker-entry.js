// Thin wrapper around the OpenNext-generated worker (.open-next/worker.js,
// rebuilt on every `opennextjs-cloudflare build`) so we can add a Cron
// Trigger `scheduled` handler alongside the Next.js `fetch` handler.
// Plain JS on purpose — this is wrangler's bundle entry, not part of the
// Next.js TypeScript project, and `.open-next/worker.js` has no types.
import openNextWorker from "./.open-next/worker.js";
import { runWatcher } from "./watcher.js";

export * from "./.open-next/worker.js";

export default {
  ...openNextWorker,
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runWatcher(env));
  },
};
