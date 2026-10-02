import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });
  if (user?.role === "CUSTOMER") redirect("/customer");
  if (user?.role === "AGENT") redirect("/agent");
  if (user?.role === "FOUNDER") redirect("/founder");

  redirect("/login");
}
