import { resolveChatProvider } from "@/lib/ai/model";

function proxyRootUrl() {
  const raw = process.env.CURSOR_OPENAI_BASE_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/v1\/?$/, "").replace(/\/chat\/completions\/?$/, "").replace(/\/+$/, "");
}

export async function GET() {
  const provider = resolveChatProvider();

  if (provider !== "cursor") {
    return Response.json({
      ok: false,
      provider,
      message: "AI_PROVIDER is not set to cursor or Cursor env vars are missing."
    });
  }

  const root = proxyRootUrl();
  const auth = process.env.CURSOR_PROXY_AUTH_KEY?.trim() || process.env.CURSOR_API_KEY?.trim();

  if (!root || !auth) {
    return Response.json({
      ok: false,
      message: "Missing CURSOR_OPENAI_BASE_URL or CURSOR_PROXY_AUTH_KEY."
    });
  }

  try {
    const health = await fetch(`${root}/health`, {
      headers: { Authorization: `Bearer ${auth}` }
    });
    const models = await fetch(`${root}/v1/models`, {
      headers: { Authorization: `Bearer ${auth}` }
    });

    return Response.json({
      ok: health.ok && models.ok,
      provider: "cursor",
      proxyRoot: root,
      health: { status: health.status, ok: health.ok },
      models: { status: models.status, ok: models.ok },
      hint:
        health.ok && models.ok
          ? "Proxy looks healthy."
          : "Check Railway deploy, root directory services/cursor-proxy, port 8080, and AUTH_KEY."
    });
  } catch (error) {
    return Response.json({
      ok: false,
      proxyRoot: root,
      message: error instanceof Error ? error.message : "Unable to reach Cursor proxy."
    });
  }
}
