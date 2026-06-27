import { createChatResponse } from "@/lib/ai/chat";
import { checkRateLimit, getClientIp } from "@/lib/ai/rate-limit";
import type { UIMessage } from "ai";

export const maxDuration = 60;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(ip);

  if (!limit.allowed) {
    return Response.json(
      { error: "Too many chat requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((limit.retryAfterMs || 60_000) / 1000))
        }
      }
    );
  }

  try {
    const body = (await request.json()) as { messages?: UIMessage[] };
    if (!body.messages?.length) {
      return Response.json({ error: "Messages are required." }, { status: 400 });
    }

    return await createChatResponse(body.messages);
  } catch (error) {
    console.error("Chat route error:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The order assistant is temporarily unavailable. Call 513-620-7002 for help."
      },
      { status: 500 }
    );
  }
}
