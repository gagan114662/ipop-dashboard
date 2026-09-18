import { isBridgeUsed } from "./cf";

export interface Goal {
  id: string;
  label: string;
  done: boolean;
  detail: string;
}

// Static, reflects real work actually shipped in hermes-agent this session —
// not fabricated business goals. Update this list by hand as real milestones land.
// The last goal is the one exception: it's computed from real bridge activity
// (see getGoals below), not hand-set, so it only flips once an authenticated
// write has actually happened.
const STATIC_GOALS: Goal[] = [
  {
    id: "triage-gate",
    label: "Doesn't wake anyone up for nothing",
    done: true,
    detail: "tools/triage/cheap_classifier.py — fails closed to 0.5 on backend error",
  },
  {
    id: "finance-reconciliation",
    label: "Never fumbles the maths",
    done: true,
    detail: "hermes_cli/finance/decimal_reconciliation.py — rejects raw float outright",
  },
  {
    id: "outreach-gate",
    label: "Never sends the same message twice",
    done: true,
    detail: "tools/outreach_safety.py, wired through hermes send --campaign-id",
  },
  {
    id: "oversight-review",
    label: "Checks finished work for fibs",
    done: true,
    detail: "cron/scripts/oversight_review.py — flags, never auto-closes",
  },
  {
    id: "verified-scheduling",
    label: "Proves it's actually still awake",
    done: true,
    detail: "Proves a cron job fires from real execution history, not just config",
  },
];

const LIVE_BRIDGE_GOAL_ID = "live-bridge";

export async function getGoals(): Promise<Goal[]> {
  const used = await isBridgeUsed();
  return [
    ...STATIC_GOALS,
    {
      id: LIVE_BRIDGE_GOAL_ID,
      label: used ? "A real AI just said hello!" : "Waiting to hear from a real AI",
      done: used,
      detail: used
        ? "Confirmed: at least one authenticated bridge write has landed in KV"
        : "Bridge is production-ready (KV + bearer token) — waiting on the first authenticated write",
    },
  ];
}
