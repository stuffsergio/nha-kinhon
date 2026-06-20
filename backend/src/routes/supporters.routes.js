import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import * as supportersController from "../controllers/supporters.controller.js";

const router = Router();

router.get("/", supportersController.list);
router.post("/", supportersController.create);
router.put("/:id/approve", authenticate, requireAdmin, supportersController.approve);
router.delete("/:id", authenticate, requireAdmin, supportersController.remove);

export default router;
