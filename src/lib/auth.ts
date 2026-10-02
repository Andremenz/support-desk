import { SignJWT } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
import { getJwtSecret, verifySessionToken } from "@/lib/session";

export async function createSession(userId: string, role: Role) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getJwtSecret());

  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires,
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;

  return verifySessionToken(session);
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
