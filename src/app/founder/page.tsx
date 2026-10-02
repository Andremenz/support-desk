import { redirect } from "next/navigation";
import { logout } from "@/app/actions";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

function ageHours(date: Date) {
  return Math.round((Date.now() - date.getTime()) / 3_600_000);
}

export default async function FounderDashboard() {
  const session = await getSession();
  if (!session || session.role !== "FOUNDER") redirect("/login");

  const openTickets = await prisma.ticket.findMany({
    where: { status: { in: ["NEW", "OPEN", "PENDING_CUSTOMER"] } },
    include: { organization: true },
  });
  const responded = await prisma.ticket.findMany({
    where: { firstResponseAt: { not: null } },
    select: { createdAt: true, firstResponseAt: true },
  });

  const unassigned = openTickets.filter(
    (ticket) => !ticket.assignedAgentId,
  ).length;
  const overdue = openTickets.filter(
    (ticket) =>
      !ticket.firstResponseAt && ageHours(ticket.createdAt) > 8,
  );
  const responseTimes = responded
    .flatMap((ticket) =>
      ticket.firstResponseAt
        ? [(ticket.firstResponseAt.getTime() - ticket.createdAt.getTime()) /
          3_600_000]
        : [],
    )
    .sort((a, b) => a - b);
  const middle = Math.floor(responseTimes.length / 2);
  const medianResponseTime =
    responseTimes.length === 0
      ? "—"
      : responseTimes.length % 2 === 0
        ? ((responseTimes[middle - 1] + responseTimes[middle]) / 2).toFixed(1)
        : responseTimes[middle].toFixed(1);
  const tiers = ["ENTERPRISE", "GROWTH", "STARTER"].map((tier) => ({
    tier,
    count: openTickets.filter((ticket) => ticket.organization.planTier === tier)
      .length,
  }));
  const oldest = [...openTickets].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  )[0];
  const card = "rounded-lg border border-gray-200 bg-white p-4";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="font-bold text-gray-900">
            SupportDesk{" "}
            <span className="text-xs font-normal text-gray-500">
              Founder dashboard
            </span>
          </span>
          <form action={logout}>
            <button className="text-sm text-gray-600 hover:text-gray-900">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-xl font-bold text-gray-900">
          Are we slow? — the honest answer
        </h1>

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className={card}>
            <div className="text-3xl font-bold text-gray-900">
              {openTickets.length}
            </div>
            <div className="mt-1 text-xs text-gray-500">Open tickets</div>
          </div>
          <div className={card}>
            <div
              className={`text-3xl font-bold ${unassigned > 0 ? "text-red-600" : "text-gray-900"}`}
            >
              {unassigned}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Unassigned (nobody owns these)
            </div>
          </div>
          <div className={card}>
            <div
              className={`text-3xl font-bold ${overdue.length > 0 ? "text-red-600" : "text-gray-900"}`}
            >
              {overdue.length}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Overdue first response (&gt;8h)
            </div>
          </div>
          <div className={card}>
            <div className="text-3xl font-bold text-gray-900">
              {medianResponseTime}h
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Median first-response time
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className={card}>
            <h2 className="mb-3 text-sm font-semibold text-gray-700">
              Open tickets by plan tier
            </h2>
            <ul className="space-y-1 text-sm">
              {tiers.map((item) => (
                <li className="flex justify-between" key={item.tier}>
                  <span>{item.tier}</span>
                  <span className="font-semibold">{item.count}</span>
                </li>
              ))}
            </ul>
            {oldest && (
              <p className="mt-4 text-xs text-gray-500">
                Oldest open ticket:{" "}
                <span className="font-medium text-gray-700">
                  {oldest.subject}
                </span>{" "}
                ({oldest.organization.name}, open {ageHours(oldest.createdAt)}h)
              </p>
            )}
          </div>

          <div className={card}>
            <h2 className="mb-3 text-sm font-semibold text-gray-700">
              Currently overdue (no first response &gt;8h)
            </h2>
            {overdue.length === 0 ? (
              <p className="text-sm text-gray-600">
                Nothing overdue right now.
              </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {overdue.map((ticket) => (
                  <li key={ticket.id}>
                    {ticket.organization.name} ({ticket.organization.planTier})
                    {" — "}
                    {ticket.subject}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-xs text-gray-400">
              First-response target of 8h is a placeholder until a real SLA
              policy is defined.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
