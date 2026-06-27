import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "tikkaxpress-admin";

function adminEmail() {
  return process.env.ADMIN_EMAIL || "owner@tikkaxpress.com";
}

function adminPassword() {
  return process.env.ADMIN_PASSWORD || "change-me";
}

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "dev-admin-session-secret";
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function validateAdminCredentials(email: string, password: string) {
  return safeEqual(email.toLowerCase(), adminEmail().toLowerCase()) && safeEqual(password, adminPassword());
}

export async function setAdminSession(email: string) {
  const normalizedEmail = email.toLowerCase();
  const value = `${normalizedEmail}.${sign(normalizedEmail)}`;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 10
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (!value) return false;
  const [email, signature] = value.split(".");
  if (!email || !signature) return false;
  return safeEqual(signature, sign(email));
}
