import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const statusLabel: Record<string, string> = {
  NEW: "Received",
  OPEN: "In progress",
  PENDING_CUSTOMER: "Waiting on you",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export default async function CustomerHome() {
  const session = await getSession();
  if (!session || session.role !== "CUSTOMER") redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });
  if (!user?.organizationId) redirect("/login");

  const tickets = await prisma.ticket.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Your requests</h1>
        <Link
          href="/customer/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          New request
        </Link>
      </div>
      {tickets.length === 0 ? (
        <p className="text-sm text-gray-600">
          No requests yet. Create one and we&apos;ll get back to you.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <Link
                href={`/customer/tickets/${ticket.id}`}
                className="block px-4 py-3 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {ticket.subject}
                  </span>
                  <span className="text-xs text-gray-500">
                    {statusLabel[ticket.status]}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Updated {ticket.updatedAt.toLocaleString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
