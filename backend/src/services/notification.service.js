import prisma from "../config/db.js";

/** Deep-link fields aligned with Expo push `data` (minus type/notificationId). */
export function notificationDeepLinkFields(orderId) {
  if (orderId) {
    return {
      orderId,
      screen: "order_tracking",
      route: `/pedido/${orderId}`,
      url: `/perfil?tab=orders&orderId=${orderId}`,
    };
  }
  return {
    orderId: null,
    url: "/notificaciones",
    route: "/notificaciones",
  };
}

export function formatNotificationForClient(notification) {
  const rest = { ...notification };
  delete rest.order;
  return {
    ...rest,
    ...notificationDeepLinkFields(rest.orderId ?? null),
  };
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  orderId,
}) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      orderId: orderId ?? null,
    },
  });

  console.log(`[NOTIFICATION] User: ${userId} | ${title}: ${message}`);

  const data = orderId
    ? {
        type,
        notificationId: notification.id,
        ...notificationDeepLinkFields(orderId),
      }
    : {
        type,
        notificationId: notification.id,
        ...notificationDeepLinkFields(null),
      };

  await sendPushToUser(userId, title, message, data);

  return notification;
}

export async function registerPushToken(userId, token, platform = "android") {
  const existing = await prisma.pushToken.findFirst({
    where: { token },
  });

  if (existing) {
    if (existing.userId !== userId) {
      await prisma.pushToken.update({
        where: { id: existing.id },
        data: { userId, platform },
      });
    }
    return existing;
  }

  return prisma.pushToken.create({
    data: { userId, token, platform },
  });
}

export async function unregisterPushToken(userId, token) {
  await prisma.pushToken.deleteMany({ where: { token, userId } });
}

async function sendPushToUser(userId, title, body, data = {}) {
  try {
    const tokens = await prisma.pushToken.findMany({ where: { userId } });
    if (tokens.length === 0) return;

    const messages = tokens.map((t) => ({
      to: t.token,
      sound: "default",
      title,
      body,
      data,
    }));

    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await res.json();
    if (!res.ok) {
      console.error("[PUSH] Error sending:", result);
    }

    const invalidTokens = [];
    if (Array.isArray(result.data)) {
      result.data.forEach((receipt, i) => {
        if (receipt.status === "error" && receipt.details?.error === "DeviceNotRegistered") {
          invalidTokens.push(tokens[i].token);
        }
      });
    }

    if (invalidTokens.length > 0) {
      await prisma.pushToken.deleteMany({ where: { token: { in: invalidTokens } } });
    }
  } catch (err) {
    console.error("[PUSH] Error:", err.message);
  }
}
