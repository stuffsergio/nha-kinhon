import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as contactsController from "../controllers/contacts.controller.js";

const router = Router();

router.get("/", authenticate, contactsController.list);
router.post("/", authenticate, contactsController.create);
router.put("/:id", authenticate, contactsController.update);
router.delete("/:id", authenticate, contactsController.remove);

export default router;
