import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import * as categoriesController from "../controllers/categories.controller.js";

const router = Router();

router.get("/", categoriesController.list);
router.get("/:id", categoriesController.getById);
router.post("/", authenticate, requireAdmin, categoriesController.create);
router.put("/:id", authenticate, requireAdmin, categoriesController.update);
router.delete("/:id", authenticate, requireAdmin, categoriesController.remove);

export default router;
