import { Router, raw } from "express";
import { authenticate } from "../middleware/auth.js";
import * as stripeController from "../controllers/stripe.controller.js";

const router = Router();

router.post("/create-payment-intent", authenticate, stripeController.createPaymentIntent);
router.post("/webhook", raw({ type: "application/json" }), stripeController.handleWebhook);

export default router;
