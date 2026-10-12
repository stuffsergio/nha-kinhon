import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireDelivery } from "../middleware/delivery.js";
import {
  deliveryLocationLimiter,
  deliveryPhotosLimiter,
  deliveryFailureLimiter,
} from "../middleware/rateLimits.js";
import { validate } from "../middleware/validate.js";
import { failedDeliveryAttemptSchema } from "../validations/refundsDelivery.js";
import * as deliveryController from "../controllers/delivery.controller.js";

const router = Router();

router.use(authenticate, requireDelivery);

router.get("/orders/available", deliveryController.listAvailable);
router.get("/orders/my", deliveryController.listMyOrders);
router.get("/orders/:id/attempts", deliveryController.getOrderFailedAttempts);
router.post("/orders/:id/pickup", deliveryController.pickupOrder);
router.put("/orders/:id/status", deliveryController.updateDeliveryStatus);
router.post(
  "/orders/:id/failed-attempt",
  deliveryFailureLimiter,
  validate(failedDeliveryAttemptSchema),
  deliveryController.reportFailedAttempt,
);
router.post("/orders/:id/photos", deliveryPhotosLimiter, deliveryController.addDeliveryPhotos);

router.get("/profile", deliveryController.getProfile);
router.put("/profile", deliveryController.updateProfile);
router.post("/profile/toggle-active", deliveryController.toggleActive);

router.get("/stats", deliveryController.getStats);
router.put("/location", deliveryLocationLimiter, deliveryController.updateLocation);

export default router;
