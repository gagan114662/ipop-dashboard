import { kvGetJSON, kvSetJSON } from "./cf";

export interface RevenueFigure {
  amountCents: number | null;
  currency: string;
  isDemo: boolean;
  note: string;
  updatedAt: number;
}

const KV_KEY = "revenue";

// null amount + isDemo:true until a real source (e.g. the decimal_reconciliation
// module, or a payment provider) pushes an actual figure via POST /api/revenue.
// Never fabricate a real-looking number here — an unset figure must render as
// "not yet connected," not as a plausible-looking placeholder dollar amount.
function defaultRevenue(now: number): RevenueFigure {
  return {
    amountCents: null,
    currency: "USD",
    isDemo: true,
    note: "Not connected yet — push a real figure via POST /api/revenue",
    updatedAt: now,
  };
}

export async function getRevenue(): Promise<RevenueFigure> {
  const revenue = await kvGetJSON<RevenueFigure | null>(KV_KEY, null);
  if (revenue) return revenue;
  const seeded = defaultRevenue(Date.now());
  await kvSetJSON(KV_KEY, seeded);
  return seeded;
}

export async function setRevenue(input: {
  amountCents: number;
  currency?: string;
  note?: string;
}): Promise<RevenueFigure> {
  const figure: RevenueFigure = {
    amountCents: input.amountCents,
    currency: input.currency || "USD",
    isDemo: false,
    note: input.note || "",
    updatedAt: Date.now(),
  };
  await kvSetJSON(KV_KEY, figure);
  return figure;
}
