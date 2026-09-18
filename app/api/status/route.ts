import { NextRequest, NextResponse } from "next/server";
import { getStatus, setCapability, type CapabilityState } from "@/lib/status";
import { requireBridgeToken } from "@/lib/cf";

export const dynamic = "force-dynamic";

const STATES: CapabilityState[] = ["idle", "working", "offline"];

export async function GET() {
  return NextResponse.json({ capabilities: await getStatus() });
}

// Bridge write: an agent reports one capability's real state, e.g.
// { "key": "browser", "state": "working", "detail": "QA pass on ipop.ai" }
export async function POST(req: NextRequest) {
  const denied = await requireBridgeToken(req);
  if (denied) return denied;

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
  const key = b.key;
  if (typeof key !== "string" || !key.trim()) {
    return NextResponse.json({ error: "key is required" }, { status: 400 });
  }
  if (b.state !== undefined && (typeof b.state !== "string" || !STATES.includes(b.state as CapabilityState))) {
    return NextResponse.json({ error: `state must be one of ${STATES.join(", ")}` }, { status: 400 });
  }
  const capabilities = await setCapability(key.trim(), {
    state: b.state as CapabilityState | undefined,
    detail: typeof b.detail === "string" ? b.detail : undefined,
    label: typeof b.label === "string" ? b.label : undefined,
  });
  return NextResponse.json({ capabilities });
}
