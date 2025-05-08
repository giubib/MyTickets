import supertest from "supertest";
import httpStatus from "http-status";
import app from "../../src/app";
import { createEventInDb, createValidEventPayload } from "../factories/event-factory";
import { cleanDb } from "../helpers";
import prisma from "../../src/database";
import { faker } from "@faker-js/faker";

const api = supertest(app);

beforeEach(async () => {
  await cleanDb();
});

describe("GET /events", () => {
  it("should return status 200 and an empty array when no events exist", async () => {
    const response = await api.get("/events");
    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual([]);
  });

  it("should return status 200 and all events when events exist", async () => {
    const event1 = await createEventInDb();
    const event2 = await createEventInDb();

    const response = await api.get("/events");

    expect(response.status).toBe(httpStatus.OK);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: event1.id,
          name: event1.name,
          date: event1.date.toISOString(),
        }),
        expect.objectContaining({
          id: event2.id,
          name: event2.name,
          date: event2.date.toISOString(),
        }),
      ])
    );
  });
});

describe("POST /events", () => {
  it("should return status 201 and create an event when given valid data", async () => {
    const payload = createValidEventPayload();
    const response = await api.post("/events").send(payload);

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: payload.name,
        date: expect.any(String),
      })
    );

    const dbEvent = await prisma.event.findUnique({ where: { id: response.body.id } });
    expect(dbEvent).toBeTruthy();
  });

  it("should return status 422 when name is missing", async () => {
    const payload = { date: faker.date.future().toISOString() };
    const response = await api.post("/events").send(payload);
    expect(response.status).toBe(httpStatus.UNPROCESSABLE_ENTITY);
  });

  it("should return status 422 when date is in the past", async () => {
    const payload = createValidEventPayload({ date: faker.date.past() });
    const response = await api.post("/events").send(payload);
    expect(response.status).toBe(httpStatus.UNPROCESSABLE_ENTITY);
  });

  it("should return status 409 when event name already exists", async () => {
    const payload = createValidEventPayload();
    await createEventInDb(payload);
    const response = await api.post("/events").send(payload);
    expect(response.status).toBe(httpStatus.CONFLICT);
  });
});
describe("Event Service Error Cases", () => {
  it("should return 404 when updating non-existent event", async () => {
    const nonExistentId = 99999;
    const updateData = { name: "New Name", date: faker.date.future().toISOString() };

    const response = await api.put(`/events/${nonExistentId}`).send(updateData);
    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it("should return 404 when deleting non-existent event", async () => {
    const nonExistentId = 99999;
    const response = await api.delete(`/events/${nonExistentId}`);
    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it("should return 422 for invalid event schema", async () => {
    const invalidPayload = { invalidField: "test" };
    const response = await api.post("/events").send(invalidPayload);
    expect(response.status).toBe(httpStatus.UNPROCESSABLE_ENTITY);
  });
});
