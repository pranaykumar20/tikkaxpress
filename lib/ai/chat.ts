import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { createRestaurantTools } from "@/lib/ai/tools";
import { resolveChatModelIds } from "@/lib/ai/model";

export async function createChatResponse(messages: UIMessage[]) {
  const now = new Date();
  const system = await buildSystemPrompt(now);
  const tools = createRestaurantTools(now);
  const modelIds = resolveChatModelIds();
  let lastError: unknown;

  for (const model of modelIds) {
    try {
      const result = streamText({
        model,
        system,
        messages: await convertToModelMessages(messages),
        tools,
        stopWhen: stepCountIs(6)
      });

      return result.toUIMessageStreamResponse({
        messageMetadata: ({ part }) => {
          if (part.type === "finish") {
            return { model };
          }
          return undefined;
        }
      });
    } catch (error) {
      lastError = error;
      console.warn(`Chat model ${model} failed, trying fallback if available.`, error);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unable to start chat.");
}
