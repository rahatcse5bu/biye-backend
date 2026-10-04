import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { PointsPackageController } from "./points_package.controller";

const router = Router();

router.get("/", PointsPackageController.listActive);
router.get("/admin", auth("admin"), PointsPackageController.listAll);
router.post("/", auth("admin"), PointsPackageController.create);
router.patch("/:id", auth("admin"), PointsPackageController.update);
router.delete("/:id", auth("admin"), PointsPackageController.remove);

export default router;
