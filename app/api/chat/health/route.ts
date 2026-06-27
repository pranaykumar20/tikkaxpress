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

  const headers = {
    Authorization: `Bearer ${auth}`,
    "Content-Type": "application/json"
  };

  try {
    const health = await fetch(`${root}/health`, { headers });
    const models = await fetch(`${root}/v1/models`, { headers });

    let chat: { status: number; ok: boolean; body?: string } = { status: 0, ok: false };
    try {
      const chatResponse = await fetch(`${root}/v1/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "composer-2.5-fast",
          stream: false,
          messages: [{ role: "user", content: "Reply with exactly: ok" }]
        }),
        signal: AbortSignal.timeout(90_000)
      });
      const body = await chatResponse.text();
      chat = {
        status: chatResponse.status,
        ok: chatResponse.ok,
        body: body.slice(0, 400)
      };
    } catch (error) {
      chat = {
        status: 0,
        ok: false,
        body: error instanceof Error ? error.message : "Chat probe failed"
      };
    }

    const ok = health.ok && models.ok && chat.ok;

    return Response.json({
      ok,
      provider: "cursor",
      proxyRoot: root,
      health: { status: health.status, ok: health.ok },
      models: { status: models.status, ok: models.ok },
      chat,
      hint: ok
        ? "Proxy and Composer chat look healthy."
        : chat.status === 502
          ? "Railway proxy crashes on chat. Redeploy after Dockerfile update, verify CURSOR_API_KEY on Railway, and check Railway deploy logs."
          : "Check Railway deploy logs and CURSOR_API_KEY from Cursor Dashboard → Integrations."
    });
  } catch (error) {
    return Response.json({
      ok: false,
      proxyRoot: root,
      message: error instanceof Error ? error.message : "Unable to reach Cursor proxy."
    });
  }
}
