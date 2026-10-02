import {
  PrismaClient,
  Role,
  PlanTier,
  TicketStatus,
  Priority,
  Visibility,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const now = Date.now();
const hoursAgo = (hours: number) => new Date(now - hours * 3_600_000);

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.message.deleteMany();
  await prisma.ticketEvent.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const acme = await prisma.organization.create({
    data: { name: "Acme Robotics", planTier: PlanTier.ENTERPRISE },
  });
  const northwind = await prisma.organization.create({
    data: { name: "Northwind Labs", planTier: PlanTier.GROWTH },
  });
  const brightline = await prisma.organization.create({
    data: { name: "Brightline Retail", planTier: PlanTier.STARTER },
  });

  const hash = await bcrypt.hash("Password123!", 10);
  const alice = await prisma.user.create({
    data: {
      email: "alice@acme.com",
      passwordHash: hash,
      role: Role.CUSTOMER,
      organizationId: acme.id,
    },
  });
  const bob = await prisma.user.create({
    data: {
      email: "bob@northwind.com",
      passwordHash: hash,
      role: Role.CUSTOMER,
      organizationId: northwind.id,
    },
  });
  const carol = await prisma.user.create({
    data: {
      email: "carol@brightline.com",
      passwordHash: hash,
      role: Role.CUSTOMER,
      organizationId: brightline.id,
    },
  });
  const maya = await prisma.user.create({
    data: {
      email: "maya@support.com",
      passwordHash: hash,
      role: Role.AGENT,
    },
  });
  await prisma.user.create({
    data: {
      email: "sam@support.com",
      passwordHash: hash,
      role: Role.FOUNDER,
    },
  });

  await prisma.ticket.create({
    data: {
      subject: "API returning 401 after rotating key",
      status: TicketStatus.NEW,
      priority: Priority.HIGH,
      organizationId: acme.id,
      createdById: alice.id,
      createdAt: hoursAgo(26),
      updatedAt: hoursAgo(26),
      messages: {
        create: {
          body: "We rotated our API keys this morning and now all requests are failing with 401. This is blocking our production line.",
          authorId: alice.id,
          visibility: Visibility.CUSTOMER_VISIBLE,
          createdAt: hoursAgo(26),
        },
      },
      events: {
        create: {
          type: "CREATED",
          actorId: alice.id,
          createdAt: hoursAgo(26),
        },
      },
    },
  });

  await prisma.ticket.create({
    data: {
      subject: "Export CSV missing custom fields",
      status: TicketStatus.OPEN,
      priority: Priority.NORMAL,
      organizationId: northwind.id,
      createdById: bob.id,
      assignedAgentId: maya.id,
      createdAt: hoursAgo(30),
      updatedAt: hoursAgo(4),
      firstResponseAt: hoursAgo(28),
      messages: {
        create: [
          {
            body: "When I export my monthly report, the custom tags are missing from the CSV.",
            authorId: bob.id,
            visibility: Visibility.CUSTOMER_VISIBLE,
            createdAt: hoursAgo(30),
          },
          {
            body: "Hi Bob, thanks for flagging — I can reproduce this on our side and have escalated to engineering. I will update you here as soon as a fix ships.",
            authorId: maya.id,
            visibility: Visibility.CUSTOMER_VISIBLE,
            createdAt: hoursAgo(28),
          },
          {
            body: "Handoff note: engineering confirmed a bug in the export serializer. Fix expected in Thursday release. Keep ticket OPEN until then.",
            authorId: maya.id,
            visibility: Visibility.INTERNAL,
            createdAt: hoursAgo(4),
          },
        ],
      },
    },
  });

  await prisma.ticket.create({
    data: {
      subject: "Question about invoice address",
      status: TicketStatus.PENDING_CUSTOMER,
      priority: Priority.LOW,
      organizationId: brightline.id,
      createdById: carol.id,
      assignedAgentId: maya.id,
      createdAt: hoursAgo(50),
      updatedAt: hoursAgo(49),
      firstResponseAt: hoursAgo(49),
      messages: {
        create: [
          {
            body: "Can we update the billing address on our last invoice?",
            authorId: carol.id,
            visibility: Visibility.CUSTOMER_VISIBLE,
            createdAt: hoursAgo(50),
          },
          {
            body: "Hi Carol, absolutely — could you confirm the exact new address line you would like on the invoice?",
            authorId: maya.id,
            visibility: Visibility.CUSTOMER_VISIBLE,
            createdAt: hoursAgo(49),
          },
        ],
      },
    },
  });

  await prisma.ticket.create({
    data: {
      subject: "Cannot invite teammate",
      status: TicketStatus.RESOLVED,
      priority: Priority.NORMAL,
      organizationId: acme.id,
      createdById: alice.id,
      assignedAgentId: maya.id,
      createdAt: hoursAgo(120),
      updatedAt: hoursAgo(115),
      firstResponseAt: hoursAgo(119),
      resolvedAt: hoursAgo(115),
      messages: {
        create: [
          {
            body: "The invite button for new teammates does nothing.",
            authorId: alice.id,
            visibility: Visibility.CUSTOMER_VISIBLE,
            createdAt: hoursAgo(120),
          },
          {
            body: "Hi Alice, this was a seat-limit on your plan — I have added two extra seats and invites work now.",
            authorId: maya.id,
            visibility: Visibility.CUSTOMER_VISIBLE,
            createdAt: hoursAgo(119),
          },
          {
            body: "Perfect, confirmed working. Thanks!",
            authorId: alice.id,
            visibility: Visibility.CUSTOMER_VISIBLE,
            createdAt: hoursAgo(115),
          },
        ],
      },
    },
  });

  console.log("✅ Seeding complete!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
