import { kvGetJSON, kvSetJSON } from "./cf";

export type CapabilityState = "idle" | "working" | "offline";

export interface Capability {
  key: string;
  label: string;
  state: CapabilityState;
  detail: string;
  updatedAt: number;
}

const KV_KEY = "status";

// Demo-tier defaults — clearly not live integrations. A real deployment
// updates these via POST /api/status as each bridge actually connects.
function defaultCapabilities(now: number): Capability[] {
  return [
    { key: "terminal", label: "Terminal", state: "idle", detail: "No command running", updatedAt: now },
    { key: "browser", label: "Browser", state: "idle", detail: "No active session", updatedAt: now },
    { key: "email", label: "Email", state: "idle", detail: "Inbox watched, nothing pending", updatedAt: now },
    { key: "phone", label: "Phone", state: "offline", detail: "Not connected (demo)", updatedAt: now },
    { key: "bank", label: "Bank", state: "offline", detail: "Not connected (demo)", updatedAt: now },
    { key: "cards", label: "Cards", state: "offline", detail: "Not connected (demo)", updatedAt: now },
  ];
}

export async function getStatus(): Promise<Capability[]> {
  const status = await kvGetJSON<Capability[] | null>(KV_KEY, null);
  if (status) return status;
  const seeded = defaultCapabilities(Date.now());
  await kvSetJSON(KV_KEY, seeded);
  return seeded;
}

export async function setCapability(
  key: string,
  patch: Partial<Pick<Capability, "state" | "detail" | "label">>
): Promise<Capability[]> {
  const current = await getStatus();
  const now = Date.now();
  let found = false;
  const next = current.map((c) => {
    if (c.key !== key) return c;
    found = true;
    return { ...c, ...patch, updatedAt: now };
  });
  if (!found) {
    next.push({
      key,
      label: patch.label || key,
      state: patch.state || "idle",
      detail: patch.detail || "",
      updatedAt: now,
    });
  }
  await kvSetJSON(KV_KEY, next);
  return next;
}
