// controllers/familyStatus.controller.ts
import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import mongoose from "mongoose";
import { FamilyStatusService } from "./family_status.service";
import { UserInfoModel } from "../user_info/user_info.model";
import { IFamilyStatus } from "./family_status.interface";

export const FamilyStatusController = {
  getFamilyStatus: catchAsync(async (req: Request, res: Response) => {
    const familyStatuses = await FamilyStatusService.getAllFamilyStatuses();
    res.status(httpStatus.OK).json({
      success: true,
      message: "All family statuses retrieved successfully",
      data: familyStatuses,
    });
  }),

  getSingleFamilyStatus: catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const familyStatus = await FamilyStatusService.getFamilyStatusById(userId);
    if (!familyStatus) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Family status not found",
      });
    }
    res.status(httpStatus.OK).json({
      success: true,
      message: "Family status retrieved successfully",
      data: familyStatus,
    });
  }),

  getFamilyStatusByUserId: catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const familyStatus = await FamilyStatusService.getFamilyStatusByUserId(
      userId
    );
    if (!familyStatus) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Family status not found for the specified user_id",
      });
    }
    res.status(httpStatus.OK).json({
      success: true,
      message: "Family status retrieved successfully",
      data: familyStatus,
    });
  }),

  getFamilyStatusByToken: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const familyStatus = await FamilyStatusService.getFamilyStatusByUserId(
      userId
    );
    if (!familyStatus) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Family status not found for the specified user_id",
      });
    }
    res.status(httpStatus.OK).json({
      success: true,
      message: "Family status retrieved successfully",
      data: familyStatus,
    });
  }),

  createFamilyStatus: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    let { user_form, ...others } = req.body;

    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "You are not authorized",
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const user: any = await UserInfoModel.findById(userId).session(session);
      if (!user) {
        throw new Error("User not found");
      }

      others.user = userId;

      const newFamilyStatus = await FamilyStatusService.createFamilyStatus(
        others,
        session
      );

      user.edited_timeline_index = Math.max(
        user.edited_timeline_index,
        user_form
      );
      user.last_edited_timeline_index = user_form;
      await user.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(httpStatus.CREATED).json({
        success: true,
        message: "Family status created  successfully",
        data: newFamilyStatus,
      });
    } catch (error: any) {
      await session.abortTransaction();
      session.endSession();
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }),

  updateFamilyStatus: catchAsync(async (req: Request, res: Response) => {
    const data: Partial<IFamilyStatus> = req.body;
    if (!req.user?._id) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "You are not authorized",
      });
    }
    const updatedQualification = await FamilyStatusService.updateFamilyStatus(
      req.user._id,
      data
    );
    if (!updatedQualification) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Family status not found",
      });
    }
    res.status(httpStatus.OK).json({
      success: true,
      message: "Family status updated successfully",
      data: updatedQualification,
    });
  }),

  deleteFamilyStatus: catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.id;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const deletedFamilyStatus = await FamilyStatusService.deleteFamilyStatus(
        userId
      );
      if (!deletedFamilyStatus) {
        throw new Error("Family status not found");
      }

      await session.commitTransaction();
      session.endSession();

      res.status(httpStatus.OK).json({
        success: true,
        message: "Family status deleted successfully",
      });
    } catch (error: any) {
      await session.abortTransaction();
      session.endSession();
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }),
};
