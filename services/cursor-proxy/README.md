# Cursor Composer proxy (Railway)

OpenAI-compatible proxy for **Composer 2.5**, used by the TikkaXpress order assistant.

## Railway setup (new project)

Yes — create a **separate Railway project** from your Vercel site:

1. Go to [railway.app](https://railway.app) → **New Project**
2. Choose **Deploy from GitHub repo** → `pranaykumar20/tikkaxpress`
3. Set **Root Directory** to `services/cursor-proxy`
4. Add **Variables**:

| Variable | Value |
|---|---|
| `CURSOR_API_KEY` | From [Cursor Dashboard → Integrations](https://cursor.com/dashboard/integrations) — must be a valid user API key |
| `AUTH_KEY` | Random secret (`openssl rand -hex 32`) |

If chat returns **502 Bad Gateway**, open **Deployments → View Logs** and confirm `CURSOR_API_KEY` is set. Redeploy after Dockerfile updates.

5. Deploy → copy the public URL (e.g. `https://cursor-proxy-production-xxxx.up.railway.app`)

## Vercel env vars (main TikkaXpress app)

In your **Vercel** project (not Railway):

| Variable | Value |
|---|---|
| `AI_PROVIDER` | `cursor` |
| `CURSOR_OPENAI_BASE_URL` | `https://YOUR-RAILWAY-URL/v1` |
| `CURSOR_PROXY_AUTH_KEY` | Same value as Railway `AUTH_KEY` |
| `AI_CHAT_MODEL` | `composer-2.5-fast` |
| `AI_CHAT_MODEL_FALLBACK` | `composer-2.5` |

Redeploy Vercel after saving.

## Security

- Never put your Cursor integration key on Vercel — only on Railway.
- `AUTH_KEY` / `CURSOR_PROXY_AUTH_KEY` is the shared secret between Vercel and Railway.
