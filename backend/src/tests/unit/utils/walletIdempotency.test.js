import { describe, it, expect, vi, beforeEach } from "vitest";

const store = new Map();

vi.mock("../../../config/db.js", () => ({
  default: {
    walletRequestIdempotency: {
      findUnique: vi.fn(({ where }) => {
        const k = `${where.scope_actorId_key.scope}:${where.scope_actorId_key.actorId}:${where.scope_actorId_key.key}`;
        return store.get(k) ?? null;
      }),
      create: vi.fn(({ data }) => {
        const k = `${data.scope}:${data.actorId}:${data.key}`;
        if (store.has(k)) {
          const err = new Error("dup");
          err.code = "P2002";
          throw err;
        }
        store.set(k, { responseBody: data.responseBody });
        return data;
      }),
    },
  },
}));

import { withWalletIdempotency } from "../../../utils/walletIdempotency.js";

describe("walletIdempotency", () => {
  beforeEach(() => {
    store.clear();
  });

  it("replays stored response for same key", async () => {
    let runs = 0;
    const run = async () => {
      runs += 1;
      return { ok: true, n: runs };
    };

    const first = await withWalletIdempotency({
      scope: "wallet_transfer",
      key: "abc12345",
      actorId: "u1",
      run,
    });
    expect(first.replay).toBe(false);
    expect(first.body.n).toBe(1);

    const second = await withWalletIdempotency({
      scope: "wallet_transfer",
      key: "abc12345",
      actorId: "u1",
      run,
    });
    expect(second.replay).toBe(true);
    expect(second.body.n).toBe(1);
    expect(runs).toBe(1);
  });
});
