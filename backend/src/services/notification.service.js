import prisma from "../config/db.js";

export async function createNotification({ userId, type, title, message }) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, message },
  });

  console.log(`[NOTIFICATION] User: ${userId} | ${title}: ${message}`);
  return notification;
}
