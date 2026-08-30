import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import ApiError from "../../middlewares/ApiError";
import { UploadService } from "./upload.service";

const uploadImages = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized");
  }

  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, "At least one image is required");
  }

  const urls = await UploadService.uploadProfileImages(files, String(userId));
  res.status(httpStatus.CREATED).json({
    success: true,
    message: "Images uploaded successfully",
    data: { urls },
  });
});

const deleteImage = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized");
  }

  if (typeof req.body?.url !== "string" || !req.body.url.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Image URL is required");
  }

  await UploadService.deleteProfileImage(req.body.url, String(userId));
  res.status(httpStatus.OK).json({
    success: true,
    message: "Image deleted successfully",
  });
});

export const UploadController = {
  uploadImages,
  deleteImage,
};
