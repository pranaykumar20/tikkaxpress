import { NextRequest, NextResponse } from "next/server";
import { applyToastOrderStatusUpdate, mapToastStatusToLocal } from "@/lib/integrations/toast/submit-order";
import { extractOrderWebhookDetails, readToastWebhook } from "@/lib/integrations/toast/webhooks";

export async function POST(request: NextRequest) {
  const parsed = await readToastWebhook(request);
  if (!parsed.ok) return parsed.response;

  const details = extractOrderWebhookDetails(parsed.payload);
  const mappedStatus = mapToastStatusToLocal(details);

  if (!mappedStatus) {
    return NextResponse.json({ received: true, ignored: true });
  }

  await applyToastOrderStatusUpdate({
    toastOrderGuid: details.toastOrderGuid || undefined,
    externalId: details.externalId || undefined,
    status: mappedStatus
  });

  return NextResponse.json({
    received: true,
    status: mappedStatus,
    toastOrderGuid: details.toastOrderGuid
  });
}
