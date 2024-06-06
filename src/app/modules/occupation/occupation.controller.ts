import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { UserInfoModel } from "../user_info/user_info.model";
import mongoose from "mongoose";
import { OccupationService } from "./occupation.service";

export const OccupationController = {
  getAllOccupationes: catchAsync(async (req: Request, res: Response) => {
    const occupationes = await OccupationService.getAllOccupationes();
    res.status(httpStatus.OK).json({
      success: true,
      message: "All occupationes retrieved successfully",
      data: occupationes,
    });
  }),

  getOccupationById: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const occupation = await OccupationService.getOccupationById(id);
    if (!occupation) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Occupation not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "Occupation retrieved successfully",
        data: occupation,
      });
    }
  }),
  getOccupationByToken: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const occupation = await OccupationService.getOccupationByToken(userId);
    if (!occupation) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Occupation not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "Occupation retrieved successfully",
        data: occupation,
      });
    }
  }),

  createOccupation: catchAsync(async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let { user_form, ...occupationData } = req.body;
      occupationData.user = req.user?._id;

      // Create occupation
      const createdOccupation = await OccupationService.createOccupation(
        occupationData,
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
        message: "Occupation created successfully",
        data: createdOccupation,
      });
    } catch (error: any) {
      // If any error occurs, abort the transaction
      await session.abortTransaction();
      session.endSession();

      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "An error occurred while creating the occupation",
        error: error.message,
      });
    }
  }),

  updateOccupation: catchAsync(async (req: Request, res: Response) => {
    const id = req.user?._id;
    if (!id) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const updatedFields = req.body;
    const updatedOccupation = await OccupationService.updateOccupation(
      id,
      updatedFields
    );
    if (!updatedOccupation) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Occupation not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "Occupation updated successfully",
        data: updatedOccupation,
      });
    }
  }),

  deleteOccupation: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    await OccupationService.deleteOccupation(id);
    res.status(httpStatus.OK).json({
      success: true,
      message: "Occupation deleted successfully",
    });
  }),
};
