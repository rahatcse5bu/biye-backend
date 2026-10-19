import express from "express";
import { photocardController } from "./photocard.controller";
import { auth } from "../../middlewares/auth";
import { rateLimit } from "../../../shared/rateLimit";

const router = express.Router();
router.use(auth("admin"));
router.use(rateLimit({ name: "photocard", windowMs: 60 * 1000, max: 10 }));

router.get("/:biodataId", photocardController.generatePhotocardForBiodata);

router.get("/:biodataId/data", photocardController.getPhotocardData);

router.get("/:biodataId/download", photocardController.downloadPhotocard);

router.get("/:biodataId/download/svg", photocardController.downloadPhotocardSVG);

router.get("/:biodataId/download/png", photocardController.downloadPhotocardPNG);

export default router;
