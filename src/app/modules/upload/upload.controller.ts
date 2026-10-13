import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import ApiError from "../../middlewares/ApiError";
import { UploadService } from "./upload.service";
import { BiodataRevisionService } from "../biodata_revision/biodata_revision.service";

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

  // TODO: a published photo stays on the live profile until the change is approved, which then deletes it.
  const live = (await BiodataRevisionService.isPublished(userId))
    ? await BiodataRevisionService.liveDoc("general_info", userId)
    : null;
  const isLivePhoto = Array.isArray(live?.photos) && live!.photos.includes(req.body.url);
  if (!isLivePhoto) await UploadService.deleteProfileImage(req.body.url, String(userId));
  res.status(httpStatus.OK).json({
    success: true,
    message: "Image deleted successfully",
  });
});

export const UploadController = {
  uploadImages,
  deleteImage,
};
