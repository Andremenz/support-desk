import { notFound, redirect } from "next/navigation";
import { customerReply } from "@/app/customer/actions";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function CustomerTicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const session = await getSession();
  if (!session || session.role !== "CUSTOMER") redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { organizationId: true },
  });
  if (!user?.organizationId) notFound();

  const ticket = await prisma.ticket.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      messages: {
        where: { visibility: "CUSTOMER_VISIBLE" },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { email: true, role: true } } },
      },
    },
  });
  if (!ticket) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
      <p className="mt-1 text-xs text-gray-500">
        Ticket #{ticket.id.slice(-6)} · opened{" "}
        {ticket.createdAt.toLocaleString()}
      </p>

      <div className="mt-6 space-y-3">
        {ticket.messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-lg border p-3 text-sm ${
              message.author.role === "CUSTOMER"
                ? "border-gray-200 bg-white"
                : "border-blue-200 bg-blue-50"
            }`}
          >
            <div className="mb-1 text-xs text-gray-500">
              {message.author.email} · {message.createdAt.toLocaleString()}
            </div>
            <p className="whitespace-pre-wrap text-gray-800">
              {message.body}
            </p>
          </div>
        ))}
      </div>

      <form action={customerReply} className="mt-6 space-y-2">
        <input type="hidden" name="ticketId" value={ticket.id} />
        <textarea
          className="w-full rounded-md border border-gray-300 p-2 text-sm"
          name="body"
          placeholder="Add more details or reply…"
          rows={4}
          maxLength={5000}
          required
        />
        {error === "invalid" && (
          <p className="text-sm text-red-700" role="alert">
            Reply must be between 1 and 5000 characters.
          </p>
        )}
        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          Send reply
        </button>
      </form>
    </div>
  );
}
