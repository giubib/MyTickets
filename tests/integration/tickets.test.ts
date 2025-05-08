import supertest from "supertest";
import httpStatus from "http-status";
import app from "../../src/app";
import { createEventInDb } from "../factories/event-factory";
import { createValidTicketPayload, createTicketInDb } from "../factories/ticket-factory";
import { cleanDb } from "../helpers";
import prisma from "../../src/database";
import { faker } from "@faker-js/faker";

const api = supertest(app);

beforeEach(async () => {
  await cleanDb();
});

describe("POST /tickets", () => {
  it("should return status 201 and create a ticket when given valid data and event exists", async () => {
    const event = await createEventInDb({ date: faker.date.future({ years: 1 }) });
    const payload = createValidTicketPayload(event.id);

    const response = await api.post("/tickets").send(payload);

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        code: payload.code,
        owner: payload.owner,
        eventId: event.id,
        used: false,
      })
    );
  });

  it("should return status 404 when eventId does not exist", async () => {
    const payload = createValidTicketPayload(faker.number.int({ min: 99999, max: 100000 }));
    const response = await api.post("/tickets").send(payload);
    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it("should return status 403 when event has already happened", async () => {
    const event = await createEventInDb({ date: faker.date.past({ years: 1 }) });
    const payload = createValidTicketPayload(event.id);
    const response = await api.post("/tickets").send(payload);
    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });

  it("should return status 409 when ticket code for the event already exists", async () => {
    const event = await createEventInDb({ date: faker.date.future({ years: 1 }) });
    const payload = createValidTicketPayload(event.id);
    await createTicketInDb(event.id, { code: payload.code });

    const response = await api.post("/tickets").send(payload);
    expect(response.status).toBe(httpStatus.CONFLICT);
  });

  it("should return status 422 when ticket code is missing", async () => {
    const event = await createEventInDb({ date: faker.date.future({ years: 1 }) });
    const { code, ...payloadWithoutCode } = createValidTicketPayload(event.id);
    const response = await api.post("/tickets").send(payloadWithoutCode);
    expect(response.status).toBe(httpStatus.UNPROCESSABLE_ENTITY);
  });
});
