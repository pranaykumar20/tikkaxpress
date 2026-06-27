import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage
} from "ai";
import { tryPrepareCartFromMessages } from "@/lib/ai/cart-intent";
import { buildCursorServerContext } from "@/lib/ai/cursor-context";
import { formatChatError } from "@/lib/ai/errors";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { createChatModel, getChatProviderLabel, resolveChatModelIds, resolveChatProvider } from "@/lib/ai/model";
import { createRestaurantTools } from "@/lib/ai/tools";

function createCursorChatResponse({
  messages,
  system,
  model,
  modelId,
  now
}: {
  messages: UIMessage[];
  system: string;
  model: ReturnType<typeof createChatModel>;
  modelId: string;
  now: Date;
}) {
  const stream = createUIMessageStream({
    originalMessages: messages,
    onError: formatChatError,
    execute: async ({ writer }) => {
      const cartHandoff = await tryPrepareCartFromMessages(messages, now);
      const result = streamText({
        model,
        system,
        messages: await convertToModelMessages(messages)
      });

      writer.merge(
        result.toUIMessageStream({
          messageMetadata: ({ part }) => {
            if (part.type === "finish") {
              return { model: modelId, provider: getChatProviderLabel() };
            }
            return undefined;
          }
        })
      );

      if (cartHandoff) {
        const toolCallId = `cart_${crypto.randomUUID()}`;
        writer.write({
          type: "tool-input-available",
          toolCallId,
          toolName: "prepareCartHandoff",
          input: cartHandoff.cart
        });
        writer.write({
          type: "tool-output-available",
          toolCallId,
          output: cartHandoff
        });
      }
    }
  });

  return createUIMessageStreamResponse({ stream });
}

export async function createChatResponse(messages: UIMessage[]) {
  const now = new Date();
  const provider = resolveChatProvider();
  let system = await buildSystemPrompt(now, provider);
  const tools = createRestaurantTools(now);
  const modelIds = resolveChatModelIds();

  if (provider === "cursor") {
    system += await buildCursorServerContext(messages, now);
  }

  if (!modelIds.length) {
    throw new Error("No chat model configured.");
  }

  let lastError: unknown;

  for (const modelId of modelIds) {
    try {
      const model = createChatModel(modelId);

      if (provider === "cursor") {
        return createCursorChatResponse({ messages, system, model, modelId, now });
      }

      const result = streamText({
        model,
        system,
        messages: await convertToModelMessages(messages),
        tools,
        stopWhen: stepCountIs(6)
      });

      return result.toUIMessageStreamResponse({
        onError: formatChatError,
        messageMetadata: ({ part }) => {
          if (part.type === "finish") {
            return { model: modelId, provider: getChatProviderLabel() };
          }
          return undefined;
        }
      });
    } catch (error) {
      lastError = error;
      console.warn(`Chat model ${modelId} failed, trying fallback if available.`, error);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unable to start chat.");
}
