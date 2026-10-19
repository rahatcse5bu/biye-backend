"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const photocard_controller_1 = require("./photocard.controller");
const auth_1 = require("../../middlewares/auth");
const rateLimit_1 = require("../../../shared/rateLimit");
const router = express_1.default.Router();
router.use((0, auth_1.auth)("admin"));
router.use((0, rateLimit_1.rateLimit)({ name: "photocard", windowMs: 60 * 1000, max: 10 }));
router.get("/:biodataId", photocard_controller_1.photocardController.generatePhotocardForBiodata);
router.get("/:biodataId/data", photocard_controller_1.photocardController.getPhotocardData);
router.get("/:biodataId/download", photocard_controller_1.photocardController.downloadPhotocard);
router.get("/:biodataId/download/svg", photocard_controller_1.photocardController.downloadPhotocardSVG);
router.get("/:biodataId/download/png", photocard_controller_1.photocardController.downloadPhotocardPNG);
exports.default = router;
