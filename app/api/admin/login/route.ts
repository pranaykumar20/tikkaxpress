import { NextRequest, NextResponse } from "next/server";
import { setAdminSession, validateAdminCredentials } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");

  if (!(await validateAdminCredentials(email, password))) {
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url), { status: 303 });
  }

  await setAdminSession(email);
  return NextResponse.redirect(new URL("/admin", request.url), { status: 303 });
}
