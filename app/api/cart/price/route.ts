import { NextRequest, NextResponse } from "next/server";
import { calculateCartPrice } from "@/lib/pricing";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pricing = await calculateCartPrice({ ...body, now: new Date() });
    return NextResponse.json(pricing);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to calculate cart." }, { status: 400 });
  }
}
