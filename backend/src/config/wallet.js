const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

function envInt(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

export function isWalletEnabled() {
  return TRUE_VALUES.has(String(process.env.WALLET_ENABLED || "").toLowerCase());
}

export const walletConfig = {
  currency: "XOF",
  depositMinMinor: envInt("WALLET_DEPOSIT_MIN_MINOR", 500),
  depositMaxMinor: envInt("WALLET_DEPOSIT_MAX_MINOR", 5_000_000),
  transferMinMinor: envInt("WALLET_TRANSFER_MIN_MINOR", 100),
  transferMaxMinor: envInt("WALLET_TRANSFER_MAX_MINOR", 500_000),
  transferDailyLimitMinor: envInt("WALLET_TRANSFER_DAILY_LIMIT_MINOR", 1_000_000),
  withdrawalMinMinor: envInt("WALLET_WITHDRAWAL_MIN_MINOR", 500),
  withdrawalMaxMinor: envInt("WALLET_WITHDRAWAL_MAX_MINOR", 2_000_000),
  /** Max safe integer for amount checks (XOF minor units). */
  amountAbsoluteMaxMinor: envInt("WALLET_AMOUNT_ABSOLUTE_MAX_MINOR", 2_147_483_647),
};

export function assertWalletFeatureEnabled() {
  if (!isWalletEnabled()) {
    const err = new Error("WALLET_DISABLED");
    err.code = "WALLET_DISABLED";
    err.status = 503;
    throw err;
  }
}
