import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";

vi.mock("../../../config/db.js", () => ({
  default: {
    user: { findUnique: vi.fn() },
    order: { count: vi.fn() },
    $transaction: vi.fn((fn) =>
      fn({
        pushToken: { deleteMany: vi.fn() },
        contact: { deleteMany: vi.fn() },
        cartItem: { deleteMany: vi.fn() },
        favorite: { deleteMany: vi.fn() },
        paymentMethod: { deleteMany: vi.fn() },
        user: { update: vi.fn() },
      }),
    ),
  },
}));

vi.mock("../../../services/wallet.service.js", () => ({
  getWalletBalanceMinor: vi.fn(),
}));

import prisma from "../../../config/db.js";
import { getWalletBalanceMinor } from "../../../services/wallet.service.js";
import { deleteUserAccount } from "../../../services/accountDeletion.service.js";

describe("accountDeletion.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks deletion with active orders (ACTIVE_ORDERS)", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      name: "Carlos",
      password: await bcrypt.hash("123456", 4),
      deletedAt: null,
      isBlocked: false,
    });
    prisma.order.count.mockResolvedValue(2);
    getWalletBalanceMinor.mockResolvedValue({ balanceMinor: 0, availableMinor: 0, pendingHoldMinor: 0 });

    await expect(
      deleteUserAccount({ userId: "u1", confirmUsername: "Carlos" }),
    ).rejects.toMatchObject({ code: "ACTIVE_ORDERS", statusCode: 409 });
  });

  it("blocks deletion with wallet balance (WALLET_BALANCE)", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      name: "Carlos",
      password: "hash",
      deletedAt: null,
      isBlocked: false,
    });
    prisma.order.count.mockResolvedValue(0);
    getWalletBalanceMinor.mockResolvedValue({ balanceMinor: 100, availableMinor: 100, pendingHoldMinor: 0 });

    await expect(
      deleteUserAccount({ userId: "u1", confirmUsername: "Carlos" }),
    ).rejects.toMatchObject({ code: "WALLET_BALANCE", statusCode: 409 });
  });

  it("accepts confirmUsername with surrounding whitespace when trim matches", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      name: "Carlos Mendes",
      deletedAt: null,
      isBlocked: false,
    });
    prisma.order.count.mockResolvedValue(0);
    getWalletBalanceMinor.mockResolvedValue({ balanceMinor: 0, availableMinor: 0, pendingHoldMinor: 0 });

    await expect(
      deleteUserAccount({ userId: "u1", confirmUsername: " Carlos Mendes " }),
    ).resolves.toMatchObject({ code: "ACCOUNT_DELETED" });
  });

  it("returns USERNAME_MISMATCH when name differs", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      name: "Carlos",
      deletedAt: null,
      isBlocked: false,
    });

    await expect(
      deleteUserAccount({ userId: "u1", confirmUsername: "Pedro" }),
    ).rejects.toMatchObject({ code: "USERNAME_MISMATCH", statusCode: 400 });
  });

  it("does not require password when omitted", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      name: "Ana",
      deletedAt: null,
      isBlocked: false,
    });
    prisma.order.count.mockResolvedValue(0);
    getWalletBalanceMinor.mockResolvedValue({ balanceMinor: 0, availableMinor: 0, pendingHoldMinor: 0 });

    await expect(deleteUserAccount({ userId: "u1", confirmUsername: "Ana" })).resolves.toMatchObject({
      code: "ACCOUNT_DELETED",
    });
  });
});
