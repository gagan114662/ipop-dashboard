import { getCloudflareContext } from "@opennextjs/cloudflare";

declare global {
  interface CloudflareEnv {
    IPOP_KV: KVNamespace;
    BRIDGE_TOKEN?: string;
    AI: Ai;
  }
}

export async function kvGetJSON<T>(key: string, fallback: T): Promise<T> {
  const { env } = await getCloudflareContext({ async: true });
  const raw = await env.IPOP_KV.get(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function kvSetJSON(key: string, value: unknown): Promise<void> {
  const { env } = await getCloudflareContext({ async: true });
  await env.IPOP_KV.put(key, JSON.stringify(value));
}

/**
 * Bearer-token guard for bridge writes. Fails closed: if BRIDGE_TOKEN isn't
 * configured (wrangler secret put BRIDGE_TOKEN), every write is refused
 * rather than silently left open.
 */
export async function requireBridgeToken(req: Request): Promise<Response | null> {
  const { env } = await getCloudflareContext({ async: true });
  const expected = env.BRIDGE_TOKEN;
  const provided = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!expected) {
    return Response.json(
      { error: "bridge writes are disabled: BRIDGE_TOKEN is not configured on the server" },
      { status: 503 }
    );
  }
  if (!provided || provided !== expected) {
    return Response.json({ error: "unauthorized: missing or invalid bearer token" }, { status: 401 });
  }
  await markBridgeUsed();
  return null;
}

/** Set once any authenticated bridge write succeeds — lets the goals list
 * honestly reflect "a real write happened", not just "the code exists". */
async function markBridgeUsed(): Promise<void> {
  const { env } = await getCloudflareContext({ async: true });
  const already = await env.IPOP_KV.get("bridge_used");
  if (already) return;
  await env.IPOP_KV.put("bridge_used", JSON.stringify({ at: Date.now() }));
}

export async function isBridgeUsed(): Promise<boolean> {
  const { env } = await getCloudflareContext({ async: true });
  return Boolean(await env.IPOP_KV.get("bridge_used"));
}
