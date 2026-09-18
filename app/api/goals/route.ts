import { NextResponse } from "next/server";
import { getGoals } from "@/lib/goals";

export const dynamic = "force-dynamic";

// Read-only and derived (no POST) — the last goal flips automatically once
// a real authenticated bridge write happens; see lib/cf.ts::markBridgeUsed.
export async function GET() {
  return NextResponse.json({ goals: await getGoals() });
}
