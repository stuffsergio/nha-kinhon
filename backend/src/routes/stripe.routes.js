import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as stripeController from "../controllers/stripe.controller.js";

const router = Router();

router.get("/config", stripeController.getConfig);
router.post("/create-checkout-session", authenticate, stripeController.createCheckoutSession);
router.post("/payment-sheet", authenticate, stripeController.createPaymentSheet);
router.post("/webhook", stripeController.handleWebhook);

export default router;
