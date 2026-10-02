import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function CustomerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "CUSTOMER") redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { organization: true },
  });
  if (!user?.organization) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="font-bold text-gray-900">
            SupportDesk{" "}
            <span className="text-xs font-normal text-gray-500">
              · {user.organization.name}
            </span>
          </div>
          <form action={logout}>
            <button className="text-sm text-gray-600 hover:text-gray-900">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
