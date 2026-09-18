export interface Goal {
  id: string;
  label: string;
  done: boolean;
  detail: string;
}

// Static, reflects real work actually shipped in hermes-agent this session —
// not fabricated business goals. Update this list by hand as real milestones land.
export const GOALS: Goal[] = [
  {
    id: "triage-gate",
    label: "Cheap triage gate on cron monitors",
    done: true,
    detail: "tools/triage/cheap_classifier.py — fails closed to 0.5 on backend error",
  },
  {
    id: "finance-reconciliation",
    label: "Decimal-exact money-math reconciliation",
    done: true,
    detail: "hermes_cli/finance/decimal_reconciliation.py — rejects raw float outright",
  },
  {
    id: "outreach-gate",
    label: "Verified-directory + dedupe gate for campaign sends",
    done: true,
    detail: "tools/outreach_safety.py, wired through hermes send --campaign-id",
  },
  {
    id: "oversight-review",
    label: "Oversight-review job over kanban tasks",
    done: true,
    detail: "cron/scripts/oversight_review.py — flags, never auto-closes",
  },
  {
    id: "verified-scheduling",
    label: "Verified-scheduling heartbeat check",
    done: true,
    detail: "Proves a cron job fires from real execution history, not just config",
  },
  {
    id: "live-bridge",
    label: "Wire a real agent to push live events to this dashboard",
    done: false,
    detail: "Bridge is production-ready (KV + bearer token) — needs a real pusher",
  },
];
