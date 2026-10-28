import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import { confirmPaymentLimiter, refundRequestLimiter } from "../middleware/rateLimits.js";
import { validate } from "../middleware/validate.js";
import {
  buyerRecipientUpdateSchema,
  refundRequestSchema,
} from "../validations/refundsDelivery.js";
import * as ordersController from "../controllers/orders.controller.js";
import * as orderResolutionController from "../controllers/orderResolution.controller.js";
import { requireWalletEnabled } from "../middleware/walletEnabled.js";
import { requireActiveUser } from "../middleware/requireActiveUser.js";
import * as walletController from "../controllers/wallet.controller.js";
import { walletMutationLimiter } from "../middleware/rateLimits.js";

const router = Router();

router.get("/", authenticate, ordersController.listMyOrders);
router.get("/admin/all", authenticate, requireAdmin, ordersController.listAll);
router.post("/checkout", authenticate, ordersController.checkout);
router.get("/:id/tracking/lean", authenticate, ordersController.getTrackingLean);
router.get("/:id/tracking", authenticate, ordersController.getTracking);
router.get("/:id/receipt", authenticate, ordersController.getReceipt);
router.get("/:id/delivery-photos", authenticate, ordersController.listDeliveryPhotos);
router.get("/:id/history", authenticate, orderResolutionController.getOrderHistory);
router.put(
  "/:id/recipient",
  authenticate,
  refundRequestLimiter,
  validate(buyerRecipientUpdateSchema),
  orderResolutionController.updateRecipient,
);
router.post(
  "/:id/reattempt",
  authenticate,
  refundRequestLimiter,
  orderResolutionController.requestReattempt,
);
router.post(
  "/:id/refund-request",
  authenticate,
  refundRequestLimiter,
  validate(refundRequestSchema),
  orderResolutionController.requestRefund,
);
router.get("/:id", authenticate, ordersController.getById);
router.post(
  "/:id/confirm-payment",
  authenticate,
  confirmPaymentLimiter,
  ordersController.confirmAfterPayment,
);
router.post(
  "/:id/pay-with-wallet",
  authenticate,
  requireActiveUser,
  requireWalletEnabled,
  walletMutationLimiter,
  walletController.payOrderWithWalletController,
);
router.put("/:id/status", authenticate, requireAdmin, ordersController.updateStatus);
router.post("/:id/cancel", authenticate, refundRequestLimiter, orderResolutionController.cancelWithRefund);

export default router;
