import express from "express";
import { UnverifiedShortlistController } from "./unverified_shortlist.controller";
import { auth } from "../../middlewares/auth";

const router = express.Router();

router.post("/", auth("user", "admin"), UnverifiedShortlistController.toggle);
router.get("/", auth("user", "admin"), UnverifiedShortlistController.getMyShortlist);
router.get("/check/:id", auth("user", "admin"), UnverifiedShortlistController.check);

export default router;
