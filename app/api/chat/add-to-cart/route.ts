import type { UIMessage } from "ai";
import { tryPrepareCartFromMessages } from "@/lib/ai/cart-intent";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { messages?: UIMessage[] };
    if (!body.messages?.length) {
      return Response.json({ ok: false, error: "Messages are required." }, { status: 400 });
    }

    const handoff = await tryPrepareCartFromMessages(body.messages);
    if (!handoff) {
      return Response.json({ ok: false, error: "No cart items matched that request." }, { status: 404 });
    }

    return Response.json({ ok: true, handoff });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update cart.";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
