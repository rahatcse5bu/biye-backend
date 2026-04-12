import express from "express";
import { photocardController } from "./photocard.controller";

const router = express.Router();

/**
 * @route GET /api/v1/photocard/:biodataId
 * @description Get photocard SVG for a biodata
 * @access Public
 */
router.get("/:biodataId", photocardController.generatePhotocardForBiodata);

/**
 * @route GET /api/v1/photocard/:biodataId/data
 * @description Get photocard data (for preview before generation)
 * @access Public
 */
router.get("/:biodataId/data", photocardController.getPhotocardData);

/**
 * @route GET /api/v1/photocard/:biodataId/download
 * @description Download photocard as SVG file
 * @access Public
 */
router.get("/:biodataId/download", photocardController.downloadPhotocard);

/**
 * @route GET /api/v1/photocard/:biodataId/download/svg
 * @description Download photocard as SVG file
 * @access Public
 */
router.get("/:biodataId/download/svg", photocardController.downloadPhotocardSVG);

/**
 * @route GET /api/v1/photocard/:biodataId/download/png
 * @description Download photocard as PNG file
 * @access Public
 */
router.get("/:biodataId/download/png", photocardController.downloadPhotocardPNG);

export default router;
