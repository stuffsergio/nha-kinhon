import { describe, it, expect, vi, beforeEach } from "vitest";

function makeTx() {
  return {
    ledgerEntry: { findUnique: vi.fn(), create: vi.fn() },
    walletTransaction: { findUnique: vi.fn(), update: vi.fn() },
    wallet: { findUnique: vi.fn() },
    user: { update: vi.fn() },
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
  };
}

let tx;

vi.mock("../../../config/db.js", () => ({
  default: {
    $transaction: vi.fn((fn) => fn(tx)),
  },
}));

vi.mock("../../../services/notification.service.js", () => ({
  createNotification: vi.fn(),
}));

import { finalizeWalletDepositFromStripe } from "../../../services/walletDeposit.service.js";

describe("walletDeposit.service webhook", () => {
  beforeEach(() => {
    tx = makeTx();
    vi.clearAllMocks();
    tx.ledgerEntry.findUnique.mockResolvedValue(null);
    tx.walletTransaction.findUnique.mockResolvedValue({
      id: "wt1",
      walletId: "w1",
      amountMinor: 2500,
      status: "PENDING",
    });
    tx.wallet.findUnique.mockResolvedValue({ id: "w1" });
    tx.$executeRaw.mockResolvedValue(1);
    tx.$queryRaw.mockResolvedValue([{ credits: 2500, debits_posted: 0, debits_pending: 0 }]);
  });

  it("credits deposit only once for duplicate webhook", async () => {
    const pi = {
      id: "pi_123",
      amount: 2500,
      amount_received: 2500,
      metadata: { type: "wallet_deposit", walletTransactionId: "wt1", userId: "u1" },
    };

    await finalizeWalletDepositFromStripe(pi);
    expect(tx.ledgerEntry.create).toHaveBeenCalledOnce();

    tx.ledgerEntry.findUnique.mockResolvedValue({ id: "le1" });
    const second = await finalizeWalletDepositFromStripe(pi);
    expect(second.idempotent).toBe(true);
    expect(tx.ledgerEntry.create).toHaveBeenCalledOnce();
  });

  it("ignores non-wallet payment intents", async () => {
    const r = await finalizeWalletDepositFromStripe({ id: "pi_x", metadata: { orderId: "o1" } });
    expect(r).toBeNull();
  });
});
