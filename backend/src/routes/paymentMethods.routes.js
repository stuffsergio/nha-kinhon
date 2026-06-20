import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as paymentMethodsController from "../controllers/paymentMethods.controller.js";

const router = Router();

router.get("/", authenticate, paymentMethodsController.list);
router.post("/", authenticate, paymentMethodsController.create);
router.put("/:id", authenticate, paymentMethodsController.update);
router.put("/:id/default", authenticate, paymentMethodsController.setDefault);
router.delete("/:id", authenticate, paymentMethodsController.remove);

export default router;
