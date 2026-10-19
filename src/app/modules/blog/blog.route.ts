import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { BlogController } from "./blog.controller";

const router = Router();

router.get("/", BlogController.listPublished);
router.get("/admin", auth("admin"), BlogController.listAll);
router.get("/:slug", BlogController.getBySlug);
router.post("/", auth("admin"), BlogController.create);
router.patch("/:id", auth("admin"), BlogController.update);
router.delete("/:id", auth("admin"), BlogController.remove);

export default router;
