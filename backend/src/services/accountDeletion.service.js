import bcrypt from "bcrypt";
import prisma from "../config/db.js";
import { codedError } from "../utils/errors.js";
import { getWalletBalanceMinor } from "./wallet.service.js";

const ACTIVE_ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERY_FAILED_ATTEMPT",
];

export async function deleteUserAccount({ userId, confirmUsername, password }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw codedError("NOT_FOUND", 404);
  if (user.deletedAt) throw codedError("ACCOUNT_ALREADY_DELETED", 409);

  if (confirmUsername !== user.name) {
    throw codedError("ACCOUNT_DELETE_USERNAME_MISMATCH", 400);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw codedError("PASSWORD_WRONG", 400);

  const activeOrders = await prisma.order.count({
    where: { userId, status: { in: ACTIVE_ORDER_STATUSES } },
  });
  if (activeOrders > 0) {
    throw codedError("ACCOUNT_DELETE_ACTIVE_ORDERS", 409);
  }

  const { balanceMinor, availableMinor, pendingHoldMinor } = await getWalletBalanceMinor(userId);
  if (balanceMinor !== 0 || availableMinor !== 0 || pendingHoldMinor !== 0) {
    throw codedError("ACCOUNT_DELETE_WALLET_BALANCE", 409);
  }

  const anonymizedEmail = `deleted_${user.id}@deleted.local`;
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.pushToken.deleteMany({ where: { userId } });
    await tx.contact.deleteMany({ where: { userId } });
    await tx.cartItem.deleteMany({ where: { userId } });
    await tx.favorite.deleteMany({ where: { userId } });
    await tx.paymentMethod.deleteMany({ where: { userId } });

    await tx.user.update({
      where: { id: userId },
      data: {
        name: "Usuario eliminado",
        email: anonymizedEmail,
        phone: null,
        avatar: null,
        refreshToken: null,
        password: await bcrypt.hash(cryptoRandom(), 10),
        balance: 0,
        deletedAt: now,
      },
    });
  });

  return { deletedAt: now.toISOString(), code: "ACCOUNT_DELETED" };
}

function cryptoRandom() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
