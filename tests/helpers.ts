import prisma from "../src/database";

export async function cleanDb() {
  await prisma.ticket.deleteMany({});
  await prisma.event.deleteMany({});
}
