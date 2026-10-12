import prisma from "../config/db.js";
import { createNotification } from "./notification.service.js";

export async function notifyAllAdmins({
  type,
  template,
  templateParams = {},
  orderId,
  acceptLanguage,
}) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        type,
        template,
        templateParams,
        orderId,
        acceptLanguage,
      }),
    ),
  );
}
