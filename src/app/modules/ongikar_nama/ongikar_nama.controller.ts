import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { UserInfoModel } from "../user_info/user_info.model";
import mongoose from "mongoose";
import { OngikarNamaService } from "./ongikar_nama.service";

export const OngikarNamaController = {
  getAllOngikarNamaes: catchAsync(async (req: Request, res: Response) => {
    const ongikarNamaes = await OngikarNamaService.getAllOngikarNamaes();
    res.status(httpStatus.OK).json({
      success: true,
      message: "All ongikarNamaes retrieved successfully",
      data: ongikarNamaes,
    });
  }),

  getOngikarNamaById: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const ongikarNama = await OngikarNamaService.getOngikarNamaById(id);
    if (!ongikarNama) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "OngikarNama not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "OngikarNama retrieved successfully",
        data: ongikarNama,
      });
    }
  }),
  getOngikarNamaByToken: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const ongikarNama = await OngikarNamaService.getOngikarNamaByToken(userId);
    if (!ongikarNama) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "OngikarNama not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "OngikarNama retrieved successfully",
        data: ongikarNama,
      });
    }
  }),

  createOngikarNama: catchAsync(async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let { user_form, ...ongikarNamaData } = req.body;
      ongikarNamaData.user = req.user?._id;

      // Create ongikarNama
      const createdOngikarNama = await OngikarNamaService.createOngikarNama(
        ongikarNamaData,
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
        message: "OngikarNama created successfully",
        data: createdOngikarNama,
      });
    } catch (error: any) {
      // If any error occurs, abort the transaction
      await session.abortTransaction();
      session.endSession();

      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "An error occurred while creating the ongikarNama",
        error: error.message,
      });
    }
  }),

  updateOngikarNama: catchAsync(async (req: Request, res: Response) => {
    const id = req.user?._id;
    if (!id) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const updatedFields = req.body;
    const updatedOngikarNama = await OngikarNamaService.updateOngikarNama(
      id,
      updatedFields
    );
    if (!updatedOngikarNama) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "OngikarNama not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "OngikarNama updated successfully",
        data: updatedOngikarNama,
      });
    }
  }),

  deleteOngikarNama: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    await OngikarNamaService.deleteOngikarNama(id);
    res.status(httpStatus.OK).json({
      success: true,
      message: "OngikarNama deleted successfully",
    });
  }),
};
