import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { UserInfoModel } from "../user_info/user_info.model";
import mongoose from "mongoose";
import { PersonalInfoService } from "./personal_info.services";

export const PersonalInfoController = {
  getAllPersonalInfoes: catchAsync(async (req: Request, res: Response) => {
    const personalInfoes = await PersonalInfoService.getAllPersonalInfoes();
    res.status(httpStatus.OK).json({
      success: true,
      message: "All personalInfoes retrieved successfully",
      data: personalInfoes,
    });
  }),

  getPersonalInfoById: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const personalInfo = await PersonalInfoService.getPersonalInfoById(id);
    if (!personalInfo) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "PersonalInfo not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "PersonalInfo retrieved successfully",
        data: personalInfo,
      });
    }
  }),
  getPersonalInfoByToken: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const personalInfo = await PersonalInfoService.getPersonalInfoByToken(
      userId
    );
    if (!personalInfo) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "PersonalInfo not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "PersonalInfo retrieved successfully",
        data: personalInfo,
      });
    }
  }),

  createPersonalInfo: catchAsync(async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let { user_form, ...personalInfoData } = req.body;
      personalInfoData.user = req.user?._id;

      // Create personalInfo
      const createdPersonalInfo = await PersonalInfoService.createPersonalInfo(
        personalInfoData,
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
        message: "PersonalInfo created successfully",
        data: createdPersonalInfo,
      });
    } catch (error: any) {
      // If any error occurs, abort the transaction
      await session.abortTransaction();
      session.endSession();

      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "An error occurred while creating the personalInfo",
        error: error.message,
      });
    }
  }),

  updatePersonalInfo: catchAsync(async (req: Request, res: Response) => {
    const id = req.user?._id;
    if (!id) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const updatedFields = req.body;
    const updatedPersonalInfo = await PersonalInfoService.updatePersonalInfo(
      id,
      updatedFields
    );
    if (!updatedPersonalInfo) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "PersonalInfo not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "PersonalInfo updated successfully",
        data: updatedPersonalInfo,
      });
    }
  }),

  deletePersonalInfo: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    await PersonalInfoService.deletePersonalInfo(id);
    res.status(httpStatus.OK).json({
      success: true,
      message: "PersonalInfo deleted successfully",
    });
  }),
};
