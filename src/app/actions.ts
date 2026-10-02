"use server";

import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { clearSession, createSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export type LoginState = {
  error: string | null;
};

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const credentials = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!credentials.success) {
    return { error: "Invalid credentials" };
  }

  const user = await prisma.user.findUnique({
    where: { email: credentials.data.email },
  });
  if (!user || !(await bcrypt.compare(credentials.data.password, user.passwordHash))) {
    return { error: "Invalid credentials" };
  }

  await createSession(user.id, user.role);

  switch (user.role) {
    case Role.CUSTOMER:
      redirect("/customer");
    case Role.AGENT:
      redirect("/agent");
    case Role.FOUNDER:
      redirect("/founder");
  }
}

export async function logout() {
  await clearSession();
  redirect("/login");
}
