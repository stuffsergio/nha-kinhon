import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.getMe);
router.put("/me", authenticate, authController.updateMe);
router.put("/me/password", authenticate, authController.changePassword);

export default router;
