import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as favoritesController from "../controllers/favorites.controller.js";

const router = Router();

router.get("/", authenticate, favoritesController.list);
router.post("/:productId", authenticate, favoritesController.add);
router.delete("/:productId", authenticate, favoritesController.remove);

export default router;
