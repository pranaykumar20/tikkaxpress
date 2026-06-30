import { NextRequest, NextResponse } from "next/server";
import { syncMenuFromToast } from "@/lib/integrations/toast/menu-sync";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await syncMenuFromToast();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Menu sync failed." }, { status: 500 });
  }
}
