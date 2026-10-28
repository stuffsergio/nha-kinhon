import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import { requireWalletEnabled } from "../middleware/walletEnabled.js";
import { validate } from "../middleware/validate.js";
import {
  adminWithdrawalDecisionSchema,
  adminWithdrawalPaidSchema,
} from "../validations/wallet.js";
import { adminWalletLimiter } from "../middleware/rateLimits.js";
import * as adminWalletController from "../controllers/admin.wallet.controller.js";

const router = Router();

router.use(authenticate, requireAdmin, requireWalletEnabled);

router.get("/withdrawals", adminWalletLimiter, adminWalletController.listWithdrawals);
router.post(
  "/withdrawals/:withdrawalId/approve",
  adminWalletLimiter,
  validate(adminWithdrawalDecisionSchema),
  adminWalletController.approve,
);
router.post(
  "/withdrawals/:withdrawalId/reject",
  adminWalletLimiter,
  validate(adminWithdrawalDecisionSchema),
  adminWalletController.reject,
);
router.post(
  "/withdrawals/:withdrawalId/mark-paid",
  adminWalletLimiter,
  validate(adminWithdrawalPaidSchema),
  adminWalletController.markPaid,
);

export default router;
