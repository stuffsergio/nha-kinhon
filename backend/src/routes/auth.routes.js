import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireSameSiteOrigin } from "../middleware/csrfOrigin.js";
import { authLimiter, refreshLimiter, accountDeleteLimiter } from "../middleware/rateLimits.js";
import { validate } from "../middleware/validate.js";
import { deleteAccountSchema } from "../validations/auth.js";
import { requireActiveUser } from "../middleware/requireActiveUser.js";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/refresh", refreshLimiter, requireSameSiteOrigin, authController.refresh);
router.post("/logout", authenticate, requireSameSiteOrigin, authController.logout);
router.get("/me", authenticate, authController.getMe);
router.put("/me", authenticate, authController.updateMe);
router.post("/me/avatar", authenticate, authController.uploadAvatar);
router.delete("/me/avatar", authenticate, authController.deleteAvatar);
router.put("/me/password", authenticate, authController.changePassword);
router.delete(
  "/me",
  authenticate,
  requireActiveUser,
  accountDeleteLimiter,
  validate(deleteAccountSchema),
  authController.deleteAccount,
);

export default router;
