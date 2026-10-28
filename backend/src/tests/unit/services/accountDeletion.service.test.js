import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";

vi.mock("../../../config/db.js", () => ({
  default: {
    user: { findUnique: vi.fn() },
    order: { count: vi.fn() },
    $transaction: vi.fn((fn) => fn({ pushToken: { deleteMany: vi.fn() }, contact: { deleteMany: vi.fn() }, cartItem: { deleteMany: vi.fn() }, favorite: { deleteMany: vi.fn() }, paymentMethod: { deleteMany: vi.fn() }, user: { update: vi.fn() } })),
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

  it("blocks deletion with active orders", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      name: "Carlos",
      password: await bcrypt.hash("123456", 4),
      deletedAt: null,
    });
    prisma.order.count.mockResolvedValue(2);
    getWalletBalanceMinor.mockResolvedValue({ balanceMinor: 0, availableMinor: 0, pendingHoldMinor: 0 });

    await expect(
      deleteUserAccount({ userId: "u1", confirmUsername: "Carlos", password: "123456" }),
    ).rejects.toMatchObject({ code: "ACCOUNT_DELETE_ACTIVE_ORDERS" });
  });

  it("blocks deletion with wallet balance", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      name: "Carlos",
      password: await bcrypt.hash("123456", 4),
      deletedAt: null,
    });
    prisma.order.count.mockResolvedValue(0);
    getWalletBalanceMinor.mockResolvedValue({ balanceMinor: 100, availableMinor: 100, pendingHoldMinor: 0 });

    await expect(
      deleteUserAccount({ userId: "u1", confirmUsername: "Carlos", password: "123456" }),
    ).rejects.toMatchObject({ code: "ACCOUNT_DELETE_WALLET_BALANCE" });
  });
});
