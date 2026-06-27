# Cursor Composer Cloud Proxy (Railway)

OpenAI-compatible proxy that calls **Cursor Cloud agents** (not local Docker agents). This fixes Railway 502 errors from `cursor-openai-api`, which requires local agents that crash in containers.

## Railway setup (separate project)

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub** → `pranaykumar20/tikkaxpress`
2. **Root Directory:** `services/cursor-proxy`
3. **Variables:**

| Variable | Value |
|---|---|
| `CURSOR_API_KEY` | [Cursor Dashboard → Integrations](https://cursor.com/dashboard/integrations) |
| `AUTH_KEY` | `openssl rand -hex 32` |

4. **Networking** → Generate domain → port **8080**

## Vercel (main app)

| Variable | Value |
|---|---|
| `AI_PROVIDER` | `cursor` |
| `CURSOR_OPENAI_BASE_URL` | `https://YOUR-RAILWAY-DOMAIN.up.railway.app/v1` |
| `CURSOR_PROXY_AUTH_KEY` | Same as Railway `AUTH_KEY` |
| `AI_CHAT_MODEL` | `composer-2.5-fast` |

Redeploy Vercel after saving.

## Notes

- First cloud-agent response can take **30–90 seconds** (VM spin-up).
- Tool calling through this proxy is limited; menu facts still come from the app system prompt.
- Check health: `https://tikkaxpress.vercel.app/api/chat/health`
