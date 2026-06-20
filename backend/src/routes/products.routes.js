import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import * as productsController from "../controllers/products.controller.js";

const router = Router();

router.get("/", productsController.list);
router.get("/:id", productsController.getById);
router.post("/", authenticate, requireAdmin, productsController.create);
router.put("/:id", authenticate, requireAdmin, productsController.update);
router.delete("/:id", authenticate, requireAdmin, productsController.remove);
router.post("/:id/image", authenticate, requireAdmin, productsController.uploadImage);

export default router;
