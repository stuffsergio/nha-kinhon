import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as deliveryAuthController from "../controllers/delivery.auth.controller.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Demasiados intentos. Intenta de nuevo en 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authLimiter, deliveryAuthController.register);
router.post("/login", authLimiter, deliveryAuthController.login);

export default router;
