import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as stripeController from "../controllers/stripe.controller.js";

const router = Router();

router.post("/create-checkout-session", authenticate, stripeController.createCheckoutSession);
router.post("/webhook", stripeController.handleWebhook);

export default router;
