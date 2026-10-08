import { Router } from "express";
import { authLimiter } from "../middleware/rateLimits.js";
import * as deliveryAuthController from "../controllers/delivery.auth.controller.js";

const router = Router();

router.post("/register", authLimiter, deliveryAuthController.register);
router.post("/login", authLimiter, deliveryAuthController.login);

export default router;
