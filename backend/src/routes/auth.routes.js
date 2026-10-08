import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireSameSiteOrigin } from "../middleware/csrfOrigin.js";
import { authLimiter, refreshLimiter } from "../middleware/rateLimits.js";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/refresh", refreshLimiter, requireSameSiteOrigin, authController.refresh);
router.post("/logout", authenticate, requireSameSiteOrigin, authController.logout);
router.get("/me", authenticate, authController.getMe);
router.put("/me", authenticate, authController.updateMe);
router.put("/me/password", authenticate, authController.changePassword);

export default router;
