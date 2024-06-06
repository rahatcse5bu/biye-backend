import { Request, Response } from "express";
import httpStatus from "http-status";

import catchAsync from "../../../shared/catchAsync";
import { EducationalQualificationService } from "./educational_qualification.services";
import mongoose from "mongoose";
import { IEducationalQualification } from "./educational_qualification.interface";
import { UserInfoModel } from "../user_info/user_info.model";

export const EducationalQualificationController = {
  getAllEducationalQualifications: catchAsync(
    async (req: Request, res: Response) => {
      const qualifications =
        await EducationalQualificationService.getAllEducationalQualifications();
      res.status(httpStatus.OK).json({
        success: true,
        message: "All educational qualifications retrieved successfully",
        data: qualifications,
      });
    }
  ),

  getSingleEducationalQualification: catchAsync(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: "Invalid ID format",
        });
      }
      const qualification =
        await EducationalQualificationService.getEducationalQualificationById(
          id
        );
      if (!qualification) {
        return res.status(httpStatus.NOT_FOUND).json({
          success: false,
          message: "Educational qualification not found",
        });
      }
      res.status(httpStatus.OK).json({
        success: true,
        message: "Educational qualification retrieved successfully",
        data: qualification,
      });
    }
  ),

  getEducationalQualificationById: catchAsync(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: "Invalid ID format",
        });
      }
      const qualification =
        await EducationalQualificationService.getEducationalQualificationById(
          id
        );
      if (!qualification) {
        return res.status(httpStatus.NOT_FOUND).json({
          success: false,
          message: "Educational qualification not found",
        });
      }
      res.status(httpStatus.OK).json({
        success: true,
        message: "Educational qualification retrieved successfully",
        data: qualification,
      });
    }
  ),

  getEducationalQualificationByUserId: catchAsync(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: "Invalid ID format",
        });
      }
      const qualification =
        await EducationalQualificationService.getEducationalQualificationByUserId(
          new mongoose.Types.ObjectId(id)
        );
      if (!qualification) {
        return res.status(httpStatus.NOT_FOUND).json({
          success: false,
          message:
            "Educational qualification not found for the specified user_id",
        });
      }
      res.status(httpStatus.OK).json({
        success: true,
        message: "Educational qualification retrieved successfully",
        data: qualification,
      });
    }
  ),
  getEducationalQualificationByToken: catchAsync(
    async (req: Request, res: Response) => {
      const id = req.user?._id;
      if (!id) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          success: false,
          message: "You are not authorized",
        });
      }

      const qualification =
        await EducationalQualificationService.getEducationalQualificationByToken(
          id
        );
      if (!qualification) {
        return res.status(httpStatus.NOT_FOUND).json({
          success: false,
          message: "Educational qualification not found",
        });
      }
      res.status(httpStatus.OK).json({
        success: true,
        message: "Educational qualification retrieved successfully",
        data: qualification,
      });
    }
  ),

  createEducationalQualification: catchAsync(
    async (req: Request, res: Response) => {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        let { user_form, ...data } = req.body;
        if (!req.user?._id) {
          return res.status(httpStatus.UNAUTHORIZED).json({
            success: false,
            message: "You are not authorized",
          });
        }
        data.user = req.user._id;

        // Create educational qualification
        const newQualification =
          await EducationalQualificationService.createEducationalQualification(
            data,
            { session }
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
          message: "Educational qualification created successfully",
          data: newQualification,
        });
      } catch (error: any) {
        // If any error occurs, abort the transaction
        await session.abortTransaction();
        session.endSession();

        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          message:
            "An error occurred while creating the educational qualification",
          error: error.message,
        });
      }
    }
  ),

  updateEducationalQualification: catchAsync(
    async (req: Request, res: Response) => {
      const data: Partial<IEducationalQualification> = req.body;
      if (!req.user?._id) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          success: false,
          message: "You are not authorized",
        });
      }
      const updatedQualification =
        await EducationalQualificationService.updateEducationalQualification(
          req.user._id,
          data
        );
      if (!updatedQualification) {
        return res.status(httpStatus.NOT_FOUND).json({
          success: false,
          message: "Educational qualification not found",
        });
      }
      res.status(httpStatus.OK).json({
        success: true,
        message: "Educational qualification updated successfully",
        data: updatedQualification,
      });
    }
  ),

  deleteEducationalQualification: catchAsync(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: "Invalid ID format",
        });
      }
      const deletedQualification =
        await EducationalQualificationService.deleteEducationalQualification(
          id
        );
      if (!deletedQualification) {
        return res.status(httpStatus.NOT_FOUND).json({
          success: false,
          message: "Educational qualification not found",
        });
      }
      res.status(httpStatus.OK).json({
        success: true,
        message: "Educational qualification deleted successfully",
      });
    }
  ),
};
