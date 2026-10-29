import { describe, it, expect, vi, beforeEach } from "vitest";

function makeTx() {
  return {
    wallet: { findUnique: vi.fn(), create: vi.fn() },
    walletTransaction: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      aggregate: vi.fn(),
    },
    ledgerEntry: { createMany: vi.fn() },
    user: { findFirst: vi.fn() },
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
  };
}

let tx;

vi.mock("../../../config/db.js", () => ({
  default: {
    user: { findUnique: vi.fn(), findFirst: vi.fn() },
    wallet: { findUnique: vi.fn(), create: vi.fn() },
    $transaction: vi.fn((fn) => fn(tx)),
  },
}));

vi.mock("../../../services/notification.service.js", () => ({
  createNotification: vi.fn(),
}));

import prisma from "../../../config/db.js";
import { transferBetweenUsers, lookupTransferRecipient } from "../../../services/wallet.service.js";

describe("wallet.service", () => {
  beforeEach(() => {
    tx = makeTx();
    vi.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({ id: "u1", deletedAt: null, isBlocked: false });
    tx.wallet.findUnique
      .mockResolvedValueOnce({ id: "w1", userId: "u1" })
      .mockResolvedValueOnce({ id: "w2", userId: "u2" });
    tx.walletTransaction.findUnique.mockResolvedValue(null);
    tx.walletTransaction.aggregate.mockResolvedValue({ _sum: { amountMinor: 0 } });
    tx.$queryRaw.mockResolvedValue([{ credits: 10000, debits_posted: 0, debits_pending: 0 }]);
    tx.$executeRaw.mockResolvedValue(1);
    tx.walletTransaction.create.mockImplementation(({ data }) => ({
      id: data.type === "TRANSFER_OUT" ? "tx-out" : "tx-in",
      ...data,
    }));
    prisma.user.findFirst.mockResolvedValue({ id: "u2", name: "Maria Silva" });
  });

  it("lookup masks recipient name without exposing full identity", async () => {
    const r = await lookupTransferRecipient("maria@example.com", "u1");
    expect(r.found).toBe(true);
    expect(r.maskedName).not.toContain("Silva");
  });

  it("rejects transfer when insufficient funds", async () => {
    tx.$queryRaw.mockResolvedValue([{ credits: 100, debits_posted: 0, debits_pending: 0 }]);
    await expect(
      transferBetweenUsers({
        senderUserId: "u1",
        recipientLookup: "maria@example.com",
        amountMinor: 5000,
        idempotencyKey: "idem-transfer-1",
      }),
    ).rejects.toMatchObject({ code: "WALLET_INSUFFICIENT_FUNDS" });
  });

  it("returns idempotent transfer when walletTransaction exists", async () => {
    tx.walletTransaction.findUnique.mockResolvedValue({
      id: "tx-out",
      type: "TRANSFER_OUT",
      amountMinor: 500,
    });
    const r = await transferBetweenUsers({
      senderUserId: "u1",
      recipientLookup: "maria@example.com",
      amountMinor: 500,
      idempotencyKey: "idem-transfer-2",
    });
    expect(r.transaction.id).toBe("tx-out");
    expect(tx.ledgerEntry.createMany).not.toHaveBeenCalled();
  });
});
