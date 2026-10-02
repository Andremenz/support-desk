"use server";

import { Priority, Prisma, TicketStatus, Visibility } from "@prisma/client";
import { redirect } from "next/navigation";
import { generateDraft } from "@/lib/ai";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireStaff() {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "AGENT" && session.role !== "FOUNDER")
  ) {
    redirect("/login");
  }
  return session;
}

function formString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function validTicketId(ticketId: string) {
  return ticketId.length > 0 && ticketId.length <= 128;
}

export async function assignToMe(formData: FormData) {
  const session = await requireStaff();
  if (session.role !== "AGENT") redirect("/agent?error=invalid");
  const ticketId = formString(formData, "ticketId");
  if (!validTicketId(ticketId)) redirect("/agent?error=not-found");

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) redirect("/agent?error=not-found");

  await prisma.$transaction([
    prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assignedAgentId: session.userId,
        status: ticket.status === "NEW" ? "OPEN" : ticket.status,
      },
    }),
    prisma.ticketEvent.create({
      data: {
        type: "ASSIGNED",
        detail: "self-assigned",
        actorId: session.userId,
        ticketId,
      },
    }),
  ]);

  redirect(`/agent/tickets/${ticketId}`);
}

export async function updateTicket(formData: FormData) {
  const session = await requireStaff();
  const ticketId = formString(formData, "ticketId");
  const status = formString(formData, "status");
  const priority = formString(formData, "priority");
  const assignedAgentId = formString(formData, "assignedAgentId");

  if (
    !validTicketId(ticketId) ||
    !Object.values(TicketStatus).some((value) => value === status) ||
    !Object.values(Priority).some((value) => value === priority)
  ) {
    if (!validTicketId(ticketId)) redirect("/agent?error=invalid");
    redirect(`/agent/tickets/${encodeURIComponent(ticketId)}?error=invalid`);
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) redirect("/agent?error=not-found");

  const data: Prisma.TicketUpdateInput = {
    status: status as TicketStatus,
    priority: priority as Priority,
  };
  if (assignedAgentId) {
    const agent = await prisma.user.findFirst({
      where: { id: assignedAgentId, role: "AGENT" },
      select: { id: true },
    });
    if (!agent) {
      redirect(`/agent/tickets/${encodeURIComponent(ticketId)}?error=invalid`);
    }
    data.assignedAgent = { connect: { id: agent.id } };
  } else {
    data.assignedAgent = { disconnect: true };
  }
  if (status === "RESOLVED") {
    data.resolvedAt = ticket.resolvedAt ?? new Date();
  } else if (ticket.status === "RESOLVED") {
    data.resolvedAt = null;
  }

  await prisma.$transaction([
    prisma.ticket.update({ where: { id: ticketId }, data }),
    prisma.ticketEvent.create({
      data: {
        type: "UPDATED",
        detail: `status=${status} priority=${priority}`,
        actorId: session.userId,
        ticketId,
      },
    }),
  ]);

  redirect(`/agent/tickets/${ticketId}`);
}

export async function agentReply(formData: FormData) {
  const session = await requireStaff();
  const ticketId = formString(formData, "ticketId");
  const body = formString(formData, "body").trim();
  if (!validTicketId(ticketId)) redirect("/agent?error=not-found");
  if (!body || body.length > 5000) {
    redirect(`/agent/tickets/${encodeURIComponent(ticketId)}?error=invalid`);
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) redirect("/agent?error=not-found");

  await prisma.$transaction([
    prisma.message.create({
      data: {
        body,
        authorId: session.userId,
        ticketId,
        visibility: Visibility.CUSTOMER_VISIBLE,
      },
    }),
    prisma.ticket.update({
      where: { id: ticketId },
      data: {
        firstResponseAt: ticket.firstResponseAt ?? new Date(),
        status: ticket.status === "NEW" ? "OPEN" : ticket.status,
      },
    }),
    prisma.ticketEvent.create({
      data: { type: "AGENT_REPLIED", actorId: session.userId, ticketId },
    }),
  ]);

  redirect(`/agent/tickets/${ticketId}`);
}

export async function addInternalNote(formData: FormData) {
  const session = await requireStaff();
  const ticketId = formString(formData, "ticketId");
  const body = formString(formData, "body").trim();
  if (!validTicketId(ticketId)) redirect("/agent?error=not-found");
  if (!body || body.length > 2000) {
    redirect(`/agent/tickets/${encodeURIComponent(ticketId)}?error=invalid`);
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });
  if (!ticket) redirect("/agent?error=not-found");

  await prisma.$transaction([
    prisma.message.create({
      data: {
        body,
        authorId: session.userId,
        ticketId,
        visibility: Visibility.INTERNAL,
      },
    }),
    prisma.ticketEvent.create({
      data: { type: "INTERNAL_NOTE", actorId: session.userId, ticketId },
    }),
  ]);

  redirect(`/agent/tickets/${ticketId}`);
}

export async function draftReply(
  ticketId: string,
): Promise<{ text?: string; error?: string }> {
  const session = await requireStaff();
  if (!validTicketId(ticketId)) return { error: "Not found" };

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      messages: {
        where: { visibility: Visibility.CUSTOMER_VISIBLE },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { email: true } } },
      },
    },
  });
  if (!ticket) return { error: "Not found" };

  const context = ticket.messages
    .map((message) => `${message.author.email}: ${message.body}`)
    .join("\n\n")
    .slice(-20_000);
  const result = await generateDraft(context);

  if (result.text) {
    await prisma.ticketEvent.create({
      data: {
        type: "AI_DRAFTED",
        actorId: session.userId,
        ticketId: ticket.id,
      },
    });
  }

  return result;
}
