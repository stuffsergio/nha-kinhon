import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireActiveUser } from "../middleware/requireActiveUser.js";
import { requireWalletEnabled } from "../middleware/walletEnabled.js";
import { validate } from "../middleware/validate.js";
import {
  walletDepositSchema,
  walletTransferSchema,
  walletWithdrawalSchema,
} from "../validations/wallet.js";
import {
  walletMutationLimiter,
  walletReadLimiter,
} from "../middleware/rateLimits.js";
import * as walletController from "../controllers/wallet.controller.js";

const router = Router();

router.use(authenticate, requireActiveUser, requireWalletEnabled);

router.get("/", walletReadLimiter, walletController.getWallet);
router.get("/transactions", walletReadLimiter, walletController.listTransactions);
router.get("/withdrawals", walletReadLimiter, walletController.listWithdrawals);
router.get("/recipients/lookup", walletReadLimiter, walletController.lookupRecipient);
router.post(
  "/deposits",
  walletMutationLimiter,
  validate(walletDepositSchema),
  walletController.createDeposit,
);
router.post(
  "/transfers",
  walletMutationLimiter,
  validate(walletTransferSchema),
  walletController.createTransfer,
);
router.post(
  "/withdrawals",
  walletMutationLimiter,
  validate(walletWithdrawalSchema),
  walletController.createWithdrawal,
);
router.post(
  "/withdrawals/:id/cancel",
  walletMutationLimiter,
  walletController.cancelWithdrawal,
);

export default router;
