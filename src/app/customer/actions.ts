"use server";

import { Visibility } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ticketSchema = z.object({
  subject: z.string().min(5).max(120),
  body: z.string().min(10).max(5000),
});

async function requireCustomer() {
  const session = await getSession();
  if (!session || session.role !== "CUSTOMER") redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });
  if (!user?.organizationId) redirect("/login");

  return { ...user, organizationId: user.organizationId };
}

function formString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function createTicket(formData: FormData) {
  try {
    const user = await requireCustomer();
    const parsed = ticketSchema.safeParse({
      subject: formString(formData, "subject").trim(),
      body: formString(formData, "body").trim(),
    });
    if (!parsed.success) {
      return { error: `Validation failed: ${parsed.error.message}` };
    }

    const ticket = await prisma.$transaction((tx) =>
      tx.ticket.create({
        data: {
          subject: parsed.data.subject,
          organizationId: user.organizationId,
          createdById: user.id,
          messages: {
            create: {
              body: parsed.data.body,
              authorId: user.id,
              visibility: Visibility.CUSTOMER_VISIBLE,
            },
          },
          events: { create: { type: "CREATED", actorId: user.id } },
        },
      }),
    );

    redirect(`/customer/tickets/${ticket.id}`);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error("CREATE TICKET ERROR:", error);
    return {
      error: "Server error: Unable to create your ticket right now. Please try again.",
    };
  }
}

export async function customerReply(formData: FormData) {
  const user = await requireCustomer();
  const ticketId = formString(formData, "ticketId");
  const body = formString(formData, "body").trim();

  if (!ticketId || !body || body.length > 5000) {
    redirect(`/customer/tickets/${encodeURIComponent(ticketId)}?error=invalid`);
  }

  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, organizationId: user.organizationId },
  });
  if (!ticket) redirect("/customer?error=not-found");

  await prisma.$transaction([
    prisma.message.create({
      data: {
        body,
        authorId: user.id,
        ticketId: ticket.id,
        visibility: Visibility.CUSTOMER_VISIBLE,
      },
    }),
    prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status:
          ticket.status === "PENDING_CUSTOMER" ? "OPEN" : ticket.status,
      },
    }),
    prisma.ticketEvent.create({
      data: {
        type: "CUSTOMER_REPLIED",
        actorId: user.id,
        ticketId: ticket.id,
      },
    }),
  ]);

  redirect(`/customer/tickets/${ticket.id}`);
}
