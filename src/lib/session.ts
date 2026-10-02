import { Role } from "@prisma/client";
import { jwtVerify } from "jose";

export type SessionPayload = {
  userId: string;
  role: Role;
};

export function getJwtSecret() {
  const value = process.env.JWT_SECRET;
  if (!value || new TextEncoder().encode(value).byteLength < 32) {
    throw new Error("JWT_SECRET must be set to at least 32 bytes.");
  }

  return new TextEncoder().encode(value);
}

function isRole(value: unknown): value is Role {
  return Object.values(Role).some((role) => role === value);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  const secret = getJwtSecret();

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    if (typeof payload.userId !== "string" || !isRole(payload.role)) {
      return null;
    }

    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}
