import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import { adminRefundLimiter } from "../middleware/rateLimits.js";
import { validate } from "../middleware/validate.js";
import {
  adminRefundDecisionSchema,
  adminManualRefundSchema,
  adminResolveUndeliverableSchema,
} from "../validations/refundsDelivery.js";
import * as adminDeliveryController from "../controllers/admin.delivery.controller.js";
import * as adminRefundsController from "../controllers/admin.refunds.controller.js";

const router = Router();

router.get("/delivery-people", authenticate, requireAdmin, adminDeliveryController.listDeliveryPeople);
router.post("/orders/:id/assign-delivery", authenticate, requireAdmin, adminDeliveryController.assignDelivery);
router.get(
  "/orders/:id/tracking/lean",
  authenticate,
  requireAdmin,
  adminDeliveryController.getOrderTrackingLean,
);
router.get("/orders/:id/tracking", authenticate, requireAdmin, adminDeliveryController.getOrderTracking);

router.get("/incidents", authenticate, requireAdmin, adminRefundsController.listIncidents);
router.get("/refunds", authenticate, requireAdmin, adminRefundsController.listRefundQueue);
router.get(
  "/orders/:id/refund-summary",
  authenticate,
  requireAdmin,
  adminRefundsController.getOrderRefundSummary,
);
router.post(
  "/refunds/:refundId/approve",
  authenticate,
  requireAdmin,
  adminRefundLimiter,
  validate(adminRefundDecisionSchema),
  adminRefundsController.approveRefund,
);
router.post(
  "/refunds/:refundId/reject",
  authenticate,
  requireAdmin,
  adminRefundLimiter,
  validate(adminRefundDecisionSchema),
  adminRefundsController.rejectRefund,
);
router.post(
  "/orders/:id/refund",
  authenticate,
  requireAdmin,
  adminRefundLimiter,
  validate(adminManualRefundSchema),
  adminRefundsController.manualRefund,
);
router.post(
  "/orders/:id/resolve-undeliverable",
  authenticate,
  requireAdmin,
  adminRefundLimiter,
  validate(adminResolveUndeliverableSchema),
  adminRefundsController.resolveUndeliverable,
);

export default router;
