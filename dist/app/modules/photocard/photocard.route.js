"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const photocard_controller_1 = require("./photocard.controller");
const router = express_1.default.Router();
/**
 * @route GET /api/v1/photocard/:biodataId
 * @description Get photocard SVG for a biodata
 * @access Public
 */
router.get("/:biodataId", photocard_controller_1.photocardController.generatePhotocardForBiodata);
/**
 * @route GET /api/v1/photocard/:biodataId/data
 * @description Get photocard data (for preview before generation)
 * @access Public
 */
router.get("/:biodataId/data", photocard_controller_1.photocardController.getPhotocardData);
/**
 * @route GET /api/v1/photocard/:biodataId/download
 * @description Download photocard as SVG file
 * @access Public
 */
router.get("/:biodataId/download", photocard_controller_1.photocardController.downloadPhotocard);
/**
 * @route GET /api/v1/photocard/:biodataId/download/svg
 * @description Download photocard as SVG file
 * @access Public
 */
router.get("/:biodataId/download/svg", photocard_controller_1.photocardController.downloadPhotocardSVG);
/**
 * @route GET /api/v1/photocard/:biodataId/download/png
 * @description Download photocard as PNG file
 * @access Public
 */
router.get("/:biodataId/download/png", photocard_controller_1.photocardController.downloadPhotocardPNG);
exports.default = router;
