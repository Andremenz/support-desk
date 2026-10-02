import Link from "next/link";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

function ageHours(date: Date) {
  return Math.round((Date.now() - date.getTime()) / 3_600_000);
}

const tierColor: Record<string, string> = {
  ENTERPRISE: "bg-red-100 text-red-700",
  GROWTH: "bg-amber-100 text-amber-700",
  STARTER: "bg-gray-100 text-gray-600",
};

export default async function AgentQueue({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; error?: string }>;
}) {
  const { view: requestedView = "open", error } = await searchParams;
  const view = ["open", "unassigned", "mine", "pending"].includes(
    requestedView,
  )
    ? requestedView
    : "open";
  const session = await getSession();
  if (
    !session ||
    (session.role !== "AGENT" && session.role !== "FOUNDER")
  ) {
    redirect("/login");
  }

  let where: Prisma.TicketWhereInput = {
    status: { in: ["NEW", "OPEN", "PENDING_CUSTOMER"] },
  };
  if (view === "unassigned") where = { ...where, assignedAgentId: null };
  if (view === "mine") {
    where = {
      assignedAgentId: session.userId,
      status: { notIn: ["RESOLVED", "CLOSED"] },
    };
  }
  if (view === "pending") where = { status: "PENDING_CUSTOMER" };

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    include: {
      organization: true,
      assignedAgent: { select: { email: true } },
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900">
        Queue · {view}
      </h1>
      {error && (
        <p className="mb-4 text-sm text-red-700" role="alert">
          The requested ticket action could not be completed.
        </p>
      )}
      {tickets.length === 0 ? (
        <p className="text-sm text-gray-600">Nothing here. Nice work.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2">Subject</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Priority</th>
                <th className="px-4 py-2">Assignee</th>
                <th className="px-4 py-2">Age (h)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((ticket) => (
                <tr className="hover:bg-gray-50" key={ticket.id}>
                  <td className="px-4 py-2">
                    <Link
                      className="font-medium text-blue-700 hover:underline"
                      href={`/agent/tickets/${ticket.id}`}
                    >
                      {ticket.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    {ticket.organization.name}{" "}
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs ${tierColor[ticket.organization.planTier]}`}
                    >
                      {ticket.organization.planTier}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{ticket.status}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {ticket.priority}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {ticket.assignedAgent?.email ?? "—"}
                  </td>
                  <td
                    className={`px-4 py-2 ${
                      ticket.status === "NEW" && ageHours(ticket.createdAt) > 8
                        ? "font-semibold text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {ageHours(ticket.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
