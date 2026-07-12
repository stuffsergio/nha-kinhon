import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as notificationsController from "../controllers/notifications.controller.js";

const router = Router();

router.get("/", authenticate, notificationsController.list);
router.put("/read-all", authenticate, notificationsController.markAllAsRead);
router.get("/unread-count", authenticate, notificationsController.unreadCount);
router.post("/push-token", authenticate, notificationsController.registerPushTokenController);
router.delete("/push-token", authenticate, notificationsController.unregisterPushTokenController);
router.put("/:id/read", authenticate, notificationsController.markAsRead);

export default router;
