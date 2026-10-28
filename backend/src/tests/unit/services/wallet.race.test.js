import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.WALLET_ENABLED = "true";

function makeTx() {
  return {
    wallet: { findUnique: vi.fn(), create: vi.fn() },
    walletTransaction: { findUnique: vi.fn(), create: vi.fn() },
    ledgerEntry: { create: vi.fn() },
    order: { findUnique: vi.fn() },
    $executeRaw: vi.fn(),
    $queryRaw: vi.fn().mockResolvedValue([{ id: "w1" }]),
  };
}

let tx;
let balanceReads = 0;

vi.mock("../../../utils/walletLock.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    sumLedgerBalancesTx: vi.fn(async () => {
      balanceReads += 1;
      if (balanceReads === 1) {
        return { balanceMinor: 5000, availableMinor: 5000, pendingHoldMinor: 0 };
      }
      return { balanceMinor: 2000, availableMinor: 2000, pendingHoldMinor: 0 };
    }),
  };
});

vi.mock("../../../config/db.js", () => ({
  default: {
    user: { findUnique: vi.fn() },
    wallet: { findUnique: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(async (fn) => fn(tx)),
  },
}));

vi.mock("../../../services/orderConfirm.service.js", () => ({
  finalizeOrderAsPaid: vi.fn(async () => ({ id: "order1", status: "CONFIRMED" })),
}));

import { payOrderWithWallet } from "../../../services/wallet.service.js";
import prisma from "../../../config/db.js";

describe("wallet order payment concurrency", () => {
  beforeEach(() => {
    tx = makeTx();
    balanceReads = 0;
    vi.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({ id: "u1", deletedAt: null, isBlocked: false });
    tx.wallet.findUnique.mockResolvedValue({ id: "w1", userId: "u1" });
    tx.order.findUnique.mockImplementation(({ where }) => {
      if (where.id === "order1") {
        return { id: "order1", userId: "u1", status: "PENDING_PAYMENT", total: 3000 };
      }
      return { id: "order2", userId: "u1", status: "PENDING_PAYMENT", total: 3000 };
    });
    tx.walletTransaction.findUnique.mockResolvedValue(null);
    tx.$executeRaw.mockResolvedValue(1);
    tx.walletTransaction.create.mockResolvedValue({ id: "wtx1", orderId: "order1" });
  });

  it("prevents double spend when balance only covers one payment", async () => {
    await payOrderWithWallet({ userId: "u1", orderId: "order1", idempotencyKey: "pay-1" });

    await expect(
      payOrderWithWallet({ userId: "u1", orderId: "order2", idempotencyKey: "pay-2" }),
    ).rejects.toMatchObject({ code: "WALLET_INSUFFICIENT_FUNDS" });
  });
});
