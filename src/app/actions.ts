"use server";

import bcrypt from "bcryptjs";
import { clearSession, createSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export type LoginState = {
  error: string | null;
};

export async function login(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { error: "Invalid credentials" };

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return { error: "Invalid credentials" };

    await createSession(user.id, user.role);

    if (user.role === "CUSTOMER") redirect("/customer");
    if (user.role === "AGENT") redirect("/agent");
    if (user.role === "FOUNDER") redirect("/founder");

    redirect("/login");
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String(error.digest).startsWith("NEXT_")
    ) {
      throw error;
    }
    const message =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : String(error);
    return { error: `Login failed: ${message}` };
  }
}

export async function logout() {
  await clearSession();
  redirect("/login");
}
