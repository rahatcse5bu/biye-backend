"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../../middlewares/auth");
const ApiError_1 = __importDefault(require("../../middlewares/ApiError"));
const upload_controller_1 = require("./upload.controller");
const router = (0, express_1.Router)();
const MAX_FILE_SIZE = 1024 * 1024;
const MAX_FILES = 5;
const uploader = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: MAX_FILES,
    },
    fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith("image/")) {
            callback(new ApiError_1.default(400, "Only image files are allowed"));
            return;
        }
        callback(null, true);
    },
});
const parseImages = (req, res, next) => {
    uploader.array("images", MAX_FILES)(req, res, (error) => {
        if (!error) {
            next();
            return;
        }
        if (error instanceof multer_1.default.MulterError) {
            const message = error.code === "LIMIT_FILE_SIZE"
                ? "Each image must be 1 MB or smaller"
                : `A maximum of ${MAX_FILES} images can be uploaded`;
            next(new ApiError_1.default(400, message));
            return;
        }
        next(error);
    });
};
router.post("/images", (0, auth_1.auth)("user", "admin"), parseImages, upload_controller_1.UploadController.uploadImages);
router.delete("/image", (0, auth_1.auth)("user", "admin"), upload_controller_1.UploadController.deleteImage);
exports.default = router;
