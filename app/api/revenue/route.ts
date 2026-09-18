import { NextRequest, NextResponse } from "next/server";
import { getRevenue, setRevenue } from "@/lib/revenue";
import { requireBridgeToken } from "@/lib/cf";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ revenue: await getRevenue() });
}

// Bridge write: { "amountCents": 128400, "currency": "USD", "note": "Stripe, MTD" }
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
  if (typeof b.amountCents !== "number" || !Number.isFinite(b.amountCents)) {
    return NextResponse.json({ error: "amountCents must be a number (integer cents)" }, { status: 400 });
  }
  const revenue = await setRevenue({
    amountCents: Math.round(b.amountCents),
    currency: typeof b.currency === "string" ? b.currency : undefined,
    note: typeof b.note === "string" ? b.note : undefined,
  });
  return NextResponse.json({ revenue });
}
