import { Ticket } from "@prisma/client";
import prisma from "../../src/database";
import { faker } from "@faker-js/faker";

export async function createTicketInDb(eventId: number, data?: Partial<Omit<Ticket, "id" | "eventId">>) {
  const created = await prisma.ticket.create({
    data: {
      code: faker.string.alphanumeric(10),
      owner: faker.person.fullName(),
      used: false,
      eventId,
      ...data,
    },
  });

  return await prisma.ticket.findUnique({
    where: { id: created.id },
    include: { Event: true },
  });
}

export function createValidTicketPayload(eventId: number) {
  return {
    code: faker.string.alphanumeric(10),
    owner: faker.person.fullName(),
    eventId,
  };
}
