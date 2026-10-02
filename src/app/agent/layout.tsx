import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions";
import { getSession } from "@/lib/auth";

export default async function AgentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "AGENT" && session.role !== "FOUNDER")
  ) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="font-bold text-gray-900">
              SupportDesk{" "}
              <span className="text-xs font-normal text-gray-500">
                Agent workspace
              </span>
            </span>
            <nav className="flex gap-4 text-sm">
              <Link
                className="text-gray-600 hover:text-gray-900"
                href="/agent?view=open"
              >
                Open
              </Link>
              <Link
                className="text-gray-600 hover:text-gray-900"
                href="/agent?view=unassigned"
              >
                Unassigned
              </Link>
              <Link
                className="text-gray-600 hover:text-gray-900"
                href="/agent?view=mine"
              >
                Mine
              </Link>
              <Link
                className="text-gray-600 hover:text-gray-900"
                href="/agent?view=pending"
              >
                Waiting on customer
              </Link>
            </nav>
          </div>
          <form action={logout}>
            <button className="text-sm text-gray-600 hover:text-gray-900">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
