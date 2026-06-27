import { serve } from "@hono/node-server";
import { Agent, Cursor, type ModelSelection } from "@cursor/sdk";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || "0.0.0.0";
const CURSOR_API_KEY = process.env.CURSOR_API_KEY || "";
const AUTH_KEY = process.env.AUTH_KEY || "";

const app = new Hono();

function openAIError(message: string, code = "invalid_request_error", status = 400) {
  return Response.json({ error: { message, type: code } }, { status });
}

function requireAuth(authorization: string | undefined) {
  if (!AUTH_KEY) return true;
  return authorization === `Bearer ${AUTH_KEY}`;
}

function resolveModel(model = "composer-2.5-fast"): ModelSelection {
  const normalized = model.trim().toLowerCase();
  if (normalized.includes("slow")) {
    return { id: "composer-2.5", params: [{ id: "fast", value: "false" }] };
  }
  if (normalized.includes("fast") || normalized === "composer-2.5") {
    return { id: "composer-2.5", params: [{ id: "fast", value: "true" }] };
  }
  return { id: model };
}

type ChatMessage = {
  role: string;
  content?: string | { type?: string; text?: string }[];
};

function messageText(content: ChatMessage["content"]) {
  if (!content) return "";
  if (typeof content === "string") return content;
  return content
    .map((part) => (typeof part === "object" && part?.text ? part.text : ""))
    .join("\n")
    .trim();
}

function messagesToPrompt(messages: ChatMessage[]) {
  return messages
    .map((message) => {
      const text = messageText(message.content);
      if (!text) return "";
      return `${message.role.toUpperCase()}: ${text}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

app.get("/health", (c) => c.json({ status: "ok", runtime: "tikkaxpress-cursor-cloud-proxy" }));

app.get("/v1/models", async (c) => {
  if (!requireAuth(c.req.header("Authorization"))) {
    return openAIError("Invalid API key", "invalid_api_key", 401);
  }
  if (!CURSOR_API_KEY) {
    return openAIError("CURSOR_API_KEY is not configured on the proxy.", "server_error", 500);
  }

  try {
    const models = await Cursor.models.list({ apiKey: CURSOR_API_KEY });
    return c.json({
      object: "list",
      data: models.map((entry, index) => ({
        id: entry.id,
        object: "model",
        created: 1_700_000_000 + index,
        owned_by: "cursor",
        display_name: entry.displayName
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to list models.";
    return openAIError(message, "server_error", 502);
  }
});

app.post("/v1/chat/completions", async (c) => {
  if (!requireAuth(c.req.header("Authorization"))) {
    return openAIError("Invalid API key", "invalid_api_key", 401);
  }
  if (!CURSOR_API_KEY) {
    return openAIError("CURSOR_API_KEY is not configured on the proxy.", "server_error", 500);
  }

  const body = await c.req.json<{
    model?: string;
    messages?: ChatMessage[];
    stream?: boolean;
    tools?: unknown[];
  }>();

  const prompt = messagesToPrompt(body.messages || []);
  if (!prompt) {
    return openAIError("messages are required.", "invalid_request_error", 400);
  }

  const model = resolveModel(body.model);
  const completionId = `chatcmpl_${crypto.randomUUID().replace(/-/g, "")}`;

  let agent: Awaited<ReturnType<typeof Agent.create>> | undefined;

  try {
    agent = await Agent.create({
      apiKey: CURSOR_API_KEY,
      model,
      cloud: { env: { type: "cloud" } },
      name: "TikkaXpress Order Assistant"
    });

    if (body.stream) {
      return streamSSE(c, async (stream) => {
        const run = await agent!.send(prompt, {
          onDelta: ({ update }) => {
            if (update.type !== "text-delta" || !update.text) return;
            void stream.writeSSE({
              data: JSON.stringify({
                id: completionId,
                object: "chat.completion.chunk",
                choices: [{ index: 0, delta: { content: update.text }, finish_reason: null }]
              })
            });
          }
        });

        const result = await run.wait();
        if (result.result) {
          await stream.writeSSE({
            data: JSON.stringify({
              id: completionId,
              object: "chat.completion.chunk",
              choices: [{ index: 0, delta: {}, finish_reason: "stop" }]
            })
          });
        }
        await stream.writeSSE({ data: "[DONE]" });
      });
    }

    const run = await agent.send(prompt);
    const result = await run.wait();

    return c.json({
      id: completionId,
      object: "chat.completion",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: result.result || "" },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cloud agent request failed.";
    return openAIError(message, "server_error", 502);
  } finally {
    agent?.close();
  }
});

app.notFound(() => openAIError("Not found", "invalid_request_error", 404));

serve({ fetch: app.fetch, port: PORT, hostname: HOST }, (info) => {
  console.log(`cursor cloud proxy listening on http://${info.address}:${info.port}`);
  if (!CURSOR_API_KEY) {
    console.warn("WARNING: CURSOR_API_KEY is not set.");
  }
});
