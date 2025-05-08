import { faker } from "@faker-js/faker";
import { Event } from "@prisma/client";
import prisma from "../../src/database";
import { CreateEventData } from "../../src/repositories/events-repository";

export function createValidEventPayload(overrides: Partial<CreateEventData> = {}): CreateEventData {
  return {
    name: overrides.name || `${faker.company.catchPhrase()} ${faker.string.alphanumeric(5)}`,
    date: overrides.date || faker.date.future({ years: 1 }),
  };
}

export async function createEventInDb(overrides: Partial<CreateEventData> = {}): Promise<Event> {
  const defaultPayload = createValidEventPayload(overrides);
  return prisma.event.create({
    data: {
      ...defaultPayload,
      date: defaultPayload.date,
    },
  });
}
