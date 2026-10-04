import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { NotificationController } from "./notification.controller";

const router = Router();

router.use(auth("user", "admin"));
router.get("/ably-token", NotificationController.ablyToken);
router.get("/", NotificationController.list);
router.get("/unread-count", NotificationController.unreadCount);
router.patch("/:id/read", NotificationController.markRead);
router.patch("/read-all", NotificationController.markAllRead);

export default router;
