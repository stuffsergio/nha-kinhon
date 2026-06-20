import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import * as marketsController from "../controllers/markets.controller.js";

const router = Router();

router.get("/", marketsController.list);
router.get("/:id", marketsController.getById);
router.post("/", authenticate, requireAdmin, marketsController.create);
router.put("/:id", authenticate, requireAdmin, marketsController.update);
router.delete("/:id", authenticate, requireAdmin, marketsController.remove);

export default router;
