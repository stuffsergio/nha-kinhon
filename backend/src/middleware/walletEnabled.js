import { assertWalletFeatureEnabled } from "../config/wallet.js";
import { codedError } from "../utils/errors.js";

export function requireWalletEnabled(req, res, next) {
  try {
    assertWalletFeatureEnabled();
    next();
  } catch (err) {
    if (err.code === "WALLET_DISABLED") {
      throw codedError("WALLET_DISABLED", 503);
    }
    throw err;
  }
}
