import type { CartHandoffPayload } from "@/lib/ai/tools";

export function cartHandoffKey(payload: CartHandoffPayload) {
  const items = payload.cart.items
    .map((item) => `${item.id}:${item.quantity}`)
    .sort()
    .join("|");

  return `${payload.cart.locationId}:${payload.cart.fulfillmentType}:${items}`;
}

export function findCartHandoffParts(message: { parts: unknown[] }) {
  return message.parts.filter((part): part is {
    type: "tool-prepareCartHandoff";
    state: "output-available";
    toolCallId?: string;
    output: CartHandoffPayload;
  } => {
    if (!part || typeof part !== "object") return false;
    const entry = part as {
      type?: string;
      state?: string;
      output?: unknown;
    };
    return (
      entry.type === "tool-prepareCartHandoff" &&
      entry.state === "output-available" &&
      Boolean(entry.output && typeof entry.output === "object" && "handoff" in entry.output)
    );
  });
}
