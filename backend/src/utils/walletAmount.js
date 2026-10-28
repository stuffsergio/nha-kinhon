import { walletConfig } from "../config/wallet.js";
import { codedError } from "./errors.js";

export function parseAmountMinor(value) {
  if (value == null || value === "") {
    throw codedError("WALLET_AMOUNT_REQUIRED", 400);
  }
  if (typeof value === "number" && !Number.isInteger(value)) {
    throw codedError("WALLET_AMOUNT_INTEGER", 400);
  }
  const n = typeof value === "string" ? parseInt(value, 10) : Math.trunc(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw codedError("WALLET_AMOUNT_INVALID", 400);
  }
  if (n > walletConfig.amountAbsoluteMaxMinor) {
    throw codedError("WALLET_AMOUNT_OVERFLOW", 400);
  }
  return n;
}

export function assertAmountInRange(amountMinor, { min, max }) {
  if (amountMinor < min) throw codedError("WALLET_AMOUNT_BELOW_MIN", 400);
  if (amountMinor > max) throw codedError("WALLET_AMOUNT_ABOVE_MAX", 400);
}
