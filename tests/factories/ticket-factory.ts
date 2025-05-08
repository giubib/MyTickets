import { faker } from "@faker-js/faker";
import { Ticket } from "@prisma/client";
import prisma from "../../src/database";
import { CreateTicketData } from "../../src/repositories/tickets-repository";
import { createEventInDb } from "./event-factory";

export function createValidTicketPayload(eventId: number, overrides: Partial<CreateTicketData> = {}): CreateTicketData {
  return {
    code: overrides.code || faker.string.alphanumeric(10).toUpperCase(),
    owner: overrides.owner || faker.person.fullName(),
    eventId: overrides.eventId || eventId,
  };
}

export async function createTicketInDb(
  eventId?: number,
  overrides: Partial<Omit<CreateTicketData, "eventId">> = {}
): Promise<Ticket> {
  let finalEventId = eventId;
  if (!finalEventId) {
    const event = await createEventInDb({ date: faker.date.future({ years: 1 }) });
    finalEventId = event.id;
  }

  const ticketData = createValidTicketPayload(finalEventId, overrides);

  return prisma.ticket.create({
    data: ticketData,
  });
}
