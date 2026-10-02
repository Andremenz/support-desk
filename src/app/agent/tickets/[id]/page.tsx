import { notFound, redirect } from "next/navigation";
import {
  addInternalNote,
  agentReply,
  assignToMe,
  updateTicket,
} from "@/app/agent/actions";
import { DraftButton } from "@/app/agent/draft-button";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AgentTicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const session = await getSession();
  if (
    !session ||
    (session.role !== "AGENT" && session.role !== "FOUNDER")
  ) {
    redirect("/login");
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      organization: true,
      assignedAgent: { select: { email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { email: true, role: true } } },
      },
      events: {
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { actor: { select: { email: true } } },
      },
    },
  });
  if (!ticket) notFound();

  const agents = await prisma.user.findMany({
    where: { role: "AGENT" },
    orderBy: { email: "asc" },
    select: { id: true, email: true },
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
        <p className="mt-1 text-xs text-gray-500">
          {ticket.organization.name} · {ticket.organization.planTier} · opened{" "}
          {ticket.createdAt.toLocaleString()}
          {ticket.firstResponseAt
            ? ` · first response ${ticket.firstResponseAt.toLocaleString()}`
            : " · ⚠ no first response yet"}
        </p>

        <div className="mt-6 space-y-3">
          {ticket.messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg border p-3 text-sm ${
                message.visibility === "INTERNAL"
                  ? "border-yellow-200 bg-yellow-50"
                  : message.author.role === "CUSTOMER"
                    ? "border-gray-200 bg-white"
                    : "border-blue-200 bg-blue-50"
              }`}
            >
              <div className="mb-1 text-xs text-gray-500">
                {message.author.email} · {message.createdAt.toLocaleString()}
                {message.visibility === "INTERNAL" && (
                  <span className="font-semibold text-yellow-700">
                    {" "}
                    · INTERNAL NOTE
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap text-gray-800">
                {message.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          {error === "invalid" && (
            <p className="mb-3 text-sm text-red-700" role="alert">
              Check the submitted ticket details and try again.
            </p>
          )}
          <DraftButton ticketId={ticket.id} />
          <form action={agentReply} className="space-y-2">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <textarea
              className="w-full rounded-md border border-gray-300 p-2 text-sm"
              name="body"
              placeholder="Reply to customer…"
              rows={4}
              maxLength={5000}
              required
            />
            <button className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
              Send reply
            </button>
          </form>
          <form action={addInternalNote} className="mt-4 space-y-2">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <textarea
              className="w-full rounded-md border border-yellow-200 bg-yellow-50 p-2 text-sm"
              name="body"
              placeholder="Internal note (invisible to customer) — use for handoffs…"
              rows={2}
              maxLength={2000}
              required
            />
            <button className="rounded-md border border-yellow-300 px-4 py-2 text-sm text-yellow-800 hover:bg-yellow-100">
              Add internal note
            </button>
          </form>
        </div>
      </div>

      <aside className="space-y-4">
        {session.role === "AGENT" && (
          <form action={assignToMe}>
            <input type="hidden" name="ticketId" value={ticket.id} />
            <button className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-700">
              Assign to me
            </button>
          </form>
        )}

        <form
          action={updateTicket}
          className="space-y-3 rounded-lg border border-gray-200 bg-white p-4"
        >
          <input type="hidden" name="ticketId" value={ticket.id} />
          <div>
            <label
              className="block text-xs font-medium text-gray-600"
              htmlFor="status"
            >
              Status
            </label>
            <select
              className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
              id="status"
              name="status"
              defaultValue={ticket.status}
            >
              <option value="NEW">NEW</option>
              <option value="OPEN">OPEN</option>
              <option value="PENDING_CUSTOMER">PENDING_CUSTOMER</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>
          <div>
            <label
              className="block text-xs font-medium text-gray-600"
              htmlFor="priority"
            >
              Priority
            </label>
            <select
              className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
              id="priority"
              name="priority"
              defaultValue={ticket.priority}
            >
              <option value="LOW">LOW</option>
              <option value="NORMAL">NORMAL</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>
          </div>
          <div>
            <label
              className="block text-xs font-medium text-gray-600"
              htmlFor="assignedAgentId"
            >
              Assignee (handoff)
            </label>
            <select
              className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
              id="assignedAgentId"
              name="assignedAgentId"
              defaultValue={ticket.assignedAgentId ?? ""}
            >
              <option value="">— Unassigned —</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.email}
                </option>
              ))}
            </select>
          </div>
          <button className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">
            Save changes
          </button>
        </form>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-xs font-semibold text-gray-600">
            Recent activity
          </h2>
          <ul className="space-y-1 text-xs text-gray-500">
            {ticket.events.map((event) => (
              <li key={event.id}>
                {event.createdAt.toLocaleString()} · {event.actor.email} ·{" "}
                {event.type}
                {event.detail ? ` (${event.detail})` : ""}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
