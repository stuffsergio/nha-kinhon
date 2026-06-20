import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as cartController from "../controllers/cart.controller.js";

const router = Router();

router.get("/", authenticate, cartController.getCart);
router.post("/items", authenticate, cartController.addItem);
router.put("/items/:id", authenticate, cartController.updateItem);
router.delete("/items/:id", authenticate, cartController.removeItem);
router.delete("/", authenticate, cartController.clearCart);

export default router;
