import supertest from "supertest";
import httpStatus from "http-status";
import app from "../../src/app";
import { createEventInDb } from "../factories/event-factory";
import { createValidTicketPayload, createTicketInDb } from "../factories/ticket-factory";
import { cleanDb } from "../helpers";
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

describe("PUT /tickets/:id/use", () => {
  it("should return status 403 when trying to reuse an already used ticket", async () => {
    const event = await createEventInDb({ date: faker.date.future({ years: 1 }) });

    const ticket = await createTicketInDb(event.id, { used: true });

    const response = await api.put(`/tickets/${ticket.id}/use`);

    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });
});

describe("GET /tickets/:eventId", () => {
  it("should return all tickets for a given event", async () => {
    const event = await createEventInDb({ date: faker.date.future({ years: 1 }) });
    const ticket1 = await createTicketInDb(event.id);
    const ticket2 = await createTicketInDb(event.id);

    const response = await api.get(`/tickets/${event.id}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: ticket1.id }), expect.objectContaining({ id: ticket2.id })])
    );
  });
});

describe("PUT /tickets/:id/use", () => {
  it("should return status 403 when trying to reuse an already used ticket", async () => {
    const event = await createEventInDb({ date: faker.date.future({ years: 1 }) });
    const ticket = await createTicketInDb(event.id, { used: true });

    const response = await api.put(`/tickets/${ticket.id}/use`);

    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });

  it("should return status 403 when event has already happened", async () => {
    const event = await createEventInDb({ date: faker.date.past({ years: 1 }) });
    const ticket = await createTicketInDb(event.id);

    const response = await api.put(`/tickets/${ticket.id}/use`);

    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });

  it("should return status 404 when ticket id does not exist", async () => {
    const response = await api.put(`/tickets/999999/use`);
    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it("should return status 204 when ticket is used successfully", async () => {
    const event = await createEventInDb({ date: faker.date.future({ years: 1 }) });
    const ticket = await createTicketInDb(event.id);

    const response = await api.put(`/tickets/${ticket.id}/use`);

    expect([httpStatus.NO_CONTENT, httpStatus.OK]).toContain(response.status);
  });
});
