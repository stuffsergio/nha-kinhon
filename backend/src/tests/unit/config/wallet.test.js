import { describe, it, expect, afterEach } from "vitest";
import { isWalletEnabled, walletConfig } from "../../../config/wallet.js";

describe("wallet config", () => {
  afterEach(() => {
    delete process.env.WALLET_ENABLED;
  });

  it("is disabled by default", () => {
    delete process.env.WALLET_ENABLED;
    expect(isWalletEnabled()).toBe(false);
  });

  it("enables with WALLET_ENABLED=true", () => {
    process.env.WALLET_ENABLED = "true";
    expect(isWalletEnabled()).toBe(true);
  });

  it("uses XOF currency constant", () => {
    expect(walletConfig.currency).toBe("XOF");
  });
});
