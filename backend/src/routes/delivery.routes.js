import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireDelivery } from "../middleware/delivery.js";
import * as deliveryController from "../controllers/delivery.controller.js";

const router = Router();

router.use(authenticate, requireDelivery);

router.get("/orders/available", deliveryController.listAvailable);
router.get("/orders/my", deliveryController.listMyOrders);
router.post("/orders/:id/pickup", deliveryController.pickupOrder);
router.put("/orders/:id/status", deliveryController.updateDeliveryStatus);

router.get("/profile", deliveryController.getProfile);
router.put("/profile", deliveryController.updateProfile);
router.post("/profile/toggle-active", deliveryController.toggleActive);

router.get("/stats", deliveryController.getStats);
router.put("/location", deliveryController.updateLocation);

export default router;
