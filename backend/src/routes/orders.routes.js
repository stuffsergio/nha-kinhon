import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import * as ordersController from "../controllers/orders.controller.js";

const router = Router();

router.get("/", authenticate, ordersController.listMyOrders);
router.get("/:id", authenticate, ordersController.getById);
router.post("/checkout", authenticate, ordersController.checkout);
router.post("/:id/confirm-payment", authenticate, ordersController.confirmAfterPayment);
router.put("/:id/status", authenticate, requireAdmin, ordersController.updateStatus);
router.post("/:id/cancel", authenticate, ordersController.cancel);
router.get("/admin/all", authenticate, requireAdmin, ordersController.listAll);

export default router;
