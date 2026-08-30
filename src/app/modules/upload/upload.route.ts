import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import { auth } from "../../middlewares/auth";
import ApiError from "../../middlewares/ApiError";
import { UploadController } from "./upload.controller";

const router = Router();
const MAX_FILE_SIZE = 1024 * 1024;
const MAX_FILES = 5;

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new ApiError(400, "Only image files are allowed"));
      return;
    }
    callback(null, true);
  },
});

const parseImages = (req: Request, res: Response, next: NextFunction) => {
  uploader.array("images", MAX_FILES)(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? "Each image must be 1 MB or smaller"
          : `A maximum of ${MAX_FILES} images can be uploaded`;
      next(new ApiError(400, message));
      return;
    }

    next(error);
  });
};

router.post(
  "/images",
  auth("user", "admin"),
  parseImages,
  UploadController.uploadImages
);
router.delete(
  "/image",
  auth("user", "admin"),
  UploadController.deleteImage
);

export default router;
