import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as notificationsController from "../controllers/notifications.controller.js";

const router = Router();

router.get("/", authenticate, notificationsController.list);
router.put("/:id/read", authenticate, notificationsController.markAsRead);
router.put("/read-all", authenticate, notificationsController.markAllAsRead);
router.get("/unread-count", authenticate, notificationsController.unreadCount);

export default router;
