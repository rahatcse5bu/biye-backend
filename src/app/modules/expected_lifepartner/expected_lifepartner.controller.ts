import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { UserInfoModel } from "../user_info/user_info.model";
import mongoose from "mongoose";
import { ExpectedPartnerService } from "./expected_lifepartner.services";

export const ExpectedPartnerController = {
  getAllExpectedPartners: catchAsync(async (req: Request, res: Response) => {
    const expectedPartners =
      await ExpectedPartnerService.getAllExpectedPartners();
    res.status(httpStatus.OK).json({
      success: true,
      message: "All expectedPartners retrieved successfully",
      data: expectedPartners,
    });
  }),

  getExpectedPartnerById: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const expectedPartner = await ExpectedPartnerService.getExpectedPartnerById(
      id
    );
    if (!expectedPartner) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "ExpectedPartner not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "ExpectedPartner retrieved successfully",
        data: expectedPartner,
      });
    }
  }),
  getExpectedPartnerByToken: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const expectedPartner =
      await ExpectedPartnerService.getExpectedPartnerByToken(userId);
    if (!expectedPartner) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "ExpectedPartner not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "ExpectedPartner retrieved successfully",
        data: expectedPartner,
      });
    }
  }),

  createExpectedPartner: catchAsync(async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let { user_form, ...expectedPartnerData } = req.body;
      expectedPartnerData.user = req.user?._id;

      // Create expectedPartner
      const createdExpectedPartner =
        await ExpectedPartnerService.createExpectedPartner(
          expectedPartnerData,
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
        message: "ExpectedPartner created successfully",
        data: createdExpectedPartner,
      });
    } catch (error: any) {
      // If any error occurs, abort the transaction
      await session.abortTransaction();
      session.endSession();

      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "An error occurred while creating the expectedPartner",
        error: error.message,
      });
    }
  }),

  updateExpectedPartner: catchAsync(async (req: Request, res: Response) => {
    const id = req.user?._id;
    if (!id) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const updatedFields = req.body;
    const updatedExpectedPartner =
      await ExpectedPartnerService.updateExpectedPartner(id, updatedFields);
    if (!updatedExpectedPartner) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "ExpectedPartner not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "ExpectedPartner updated successfully",
        data: updatedExpectedPartner,
      });
    }
  }),

  deleteExpectedPartner: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    await ExpectedPartnerService.deleteExpectedPartner(id);
    res.status(httpStatus.OK).json({
      success: true,
      message: "ExpectedPartner deleted successfully",
    });
  }),
};
