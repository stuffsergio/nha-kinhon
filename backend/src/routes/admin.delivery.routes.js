import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import * as adminDeliveryController from "../controllers/admin.delivery.controller.js";

const router = Router();

router.get("/delivery-people", authenticate, requireAdmin, adminDeliveryController.listDeliveryPeople);
router.post("/orders/:id/assign-delivery", authenticate, requireAdmin, adminDeliveryController.assignDelivery);
router.get("/orders/:id/tracking", authenticate, requireAdmin, adminDeliveryController.getOrderTracking);

export default router;
