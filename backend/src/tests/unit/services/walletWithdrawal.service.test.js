import { describe, it, expect, vi, beforeEach } from "vitest";

const tx = {
  withdrawalRequest: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  walletTransaction: { findUnique: vi.fn(), update: vi.fn() },
  ledgerEntry: { updateMany: vi.fn() },
};

vi.mock("../../../config/db.js", () => ({
  default: {
    $transaction: vi.fn((fn) => fn(tx)),
    withdrawalRequest: { findMany: vi.fn() },
  },
}));

vi.mock("../../../utils/walletLock.js", () => ({
  lockWalletRow: vi.fn(),
}));

vi.mock("../../../services/notification.service.js", () => ({
  createNotification: vi.fn(),
}));

vi.mock("../../../services/adminAudit.service.js", () => ({
  logAdminAction: vi.fn(),
}));

vi.mock("../../../services/wallet.service.js", () => ({
  assertWalletOperableUser: vi.fn(),
  getOrCreateWallet: vi.fn(),
}));

vi.mock("../../../services/walletPayout.provider.js", () => ({
  getPayoutProvider: vi.fn(),
}));

import prisma from "../../../config/db.js";
import {
  cancelWithdrawalByUser,
  listWithdrawalsForUser,
} from "../../../services/walletWithdrawal.service.js";
import { lockWalletRow } from "../../../utils/walletLock.js";

describe("walletWithdrawal.service (user)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listWithdrawalsForUser", () => {
    it("returns paginated withdrawals for the user", async () => {
      prisma.withdrawalRequest.findMany.mockResolvedValue([
        { id: "w1", status: "PENDING", amountMinor: 1000 },
      ]);

      const result = await listWithdrawalsForUser("u1", { limit: 20 });

      expect(prisma.withdrawalRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "u1" },
          take: 21,
        }),
      );
      expect(result.withdrawals).toHaveLength(1);
      expect(result.nextCursor).toBeNull();
    });
  });

  describe("cancelWithdrawalByUser", () => {
    const pendingWr = {
      id: "wr1",
      userId: "u1",
      status: "PENDING",
      walletTransactionId: "wt1",
      walletTransaction: { id: "wt1", walletId: "wal1", status: "PENDING" },
    };

    it("releases hold and marks CANCELLED when PENDING", async () => {
      tx.withdrawalRequest.findUnique.mockResolvedValue(pendingWr);
      tx.withdrawalRequest.update.mockResolvedValue({ ...pendingWr, status: "CANCELLED" });
      tx.walletTransaction.findUnique.mockResolvedValue({ id: "wt1", status: "CANCELLED" });

      const result = await cancelWithdrawalByUser({ userId: "u1", withdrawalId: "wr1" });

      expect(lockWalletRow).toHaveBeenCalledWith(tx, "wal1");
      expect(tx.ledgerEntry.updateMany).toHaveBeenCalledWith({
        where: { walletTransactionId: "wt1", status: "PENDING" },
        data: { status: "REVERSED" },
      });
      expect(tx.walletTransaction.update).toHaveBeenCalledWith({
        where: { id: "wt1" },
        data: { status: "CANCELLED" },
      });
      expect(result.idempotent).toBe(false);
      expect(result.withdrawalRequest.status).toBe("CANCELLED");
    });

    it("is idempotent when already CANCELLED", async () => {
      tx.withdrawalRequest.findUnique.mockResolvedValue({
        ...pendingWr,
        status: "CANCELLED",
        walletTransaction: { id: "wt1", status: "CANCELLED" },
      });

      const result = await cancelWithdrawalByUser({ userId: "u1", withdrawalId: "wr1" });

      expect(result.idempotent).toBe(true);
      expect(tx.ledgerEntry.updateMany).not.toHaveBeenCalled();
    });

    it("returns NOT_FOUND for another user's withdrawal", async () => {
      tx.withdrawalRequest.findUnique.mockResolvedValue({ ...pendingWr, userId: "other" });

      await expect(
        cancelWithdrawalByUser({ userId: "u1", withdrawalId: "wr1" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND", statusCode: 404 });
    });

    it("rejects cancel when not PENDING", async () => {
      tx.withdrawalRequest.findUnique.mockResolvedValue({
        ...pendingWr,
        status: "APPROVED",
      });

      await expect(
        cancelWithdrawalByUser({ userId: "u1", withdrawalId: "wr1" }),
      ).rejects.toMatchObject({ code: "WALLET_WITHDRAWAL_NOT_PENDING", statusCode: 409 });
    });
  });
});
