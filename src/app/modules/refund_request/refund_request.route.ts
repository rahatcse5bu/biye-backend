import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { RefundRequestController } from "./refund_request.controller";

const router = Router();

router.post("/", auth("user", "admin"), RefundRequestController.create);
router.get("/me", auth("user", "admin"), RefundRequestController.listMine);
router.get("/", auth("admin"), RefundRequestController.listAll);
router.post("/:id/approve", auth("admin"), RefundRequestController.approve);
router.post("/:id/reject", auth("admin"), RefundRequestController.reject);

export default router;
