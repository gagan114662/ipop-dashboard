import { getCloudflareContext } from "@opennextjs/cloudflare";

declare global {
  interface CloudflareEnv {
    IPOP_KV: KVNamespace;
    BRIDGE_TOKEN?: string;
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
  return null;
}
