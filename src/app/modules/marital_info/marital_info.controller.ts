import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { UserInfoModel } from "../user_info/user_info.model";
import mongoose from "mongoose";
import { MaritalInfoService } from "./marital_info.service";

export const MaritalInfoController = {
  getAllMaritalInfos: catchAsync(async (req: Request, res: Response) => {
    const maritalInfos = await MaritalInfoService.getAllMaritalInfos();
    res.status(httpStatus.OK).json({
      success: true,
      message: "All maritalInfos retrieved successfully",
      data: maritalInfos,
    });
  }),

  getMaritalInfoById: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const maritalInfo = await MaritalInfoService.getMaritalInfoById(id);
    if (!maritalInfo) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "MaritalInfo not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "MaritalInfo retrieved successfully",
        data: maritalInfo,
      });
    }
  }),
  getMaritalInfoByToken: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const maritalInfo = await MaritalInfoService.getMaritalInfoByToken(userId);
    if (!maritalInfo) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "MaritalInfo not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "MaritalInfo retrieved successfully",
        data: maritalInfo,
      });
    }
  }),

  createMaritalInfo: catchAsync(async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let { user_form, ...maritalInfoData } = req.body;
      maritalInfoData.user = req.user?._id;

      // Create maritalInfo
      const createdMaritalInfo = await MaritalInfoService.createMaritalInfo(
        maritalInfoData,
        {
          session,
        }
      );

      // Find user and update the fields
      const user: any = await UserInfoModel.findById(req.user?._id).session(
        session
      );

      user.edited_timeline_index = Math.max(
        user.edited_timeline_index,
        user_form
      );
      user.last_edited_timeline_index = user_form;
      await user.save({ session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      res.status(httpStatus.CREATED).json({
        success: true,
        message: "MaritalInfo created successfully",
        data: createdMaritalInfo,
      });
    } catch (error: any) {
      // If any error occurs, abort the transaction
      await session.abortTransaction();
      session.endSession();

      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "An error occurred while creating the maritalInfo",
        error: error.message,
      });
    }
  }),

  updateMaritalInfo: catchAsync(async (req: Request, res: Response) => {
    const id = req.user?._id;
    if (!id) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const updatedFields = req.body;
    const updatedMaritalInfo = await MaritalInfoService.updateMaritalInfo(
      id,
      updatedFields
    );
    if (!updatedMaritalInfo) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "MaritalInfo not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "MaritalInfo updated successfully",
        data: updatedMaritalInfo,
      });
    }
  }),

  deleteMaritalInfo: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    await MaritalInfoService.deleteMaritalInfo(id);
    res.status(httpStatus.OK).json({
      success: true,
      message: "MaritalInfo deleted successfully",
    });
  }),
};
