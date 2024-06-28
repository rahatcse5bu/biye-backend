import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { UserInfoModel } from "../user_info/user_info.model";
import mongoose from "mongoose";
import { ContactPurchaseService } from "./contact_purchase_data.services";
import ApiError from "../../middlewares/ApiError";
import { IContactPurchase } from "./contact_purchase_data.interface";
import BioChoice from "../bio_choice_data/bio_choice_data.model";

export const ContactPurchaseController = {
  getAllContactPurchases: catchAsync(async (req: Request, res: Response) => {
    const contactPurchases =
      await ContactPurchaseService.getAllContactPurchases();
    res.status(httpStatus.OK).json({
      success: true,
      message: "All contact Purchases retrieved successfully",
      data: contactPurchases,
    });
  }),

  getContactPurchaseById: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const contactPurchase = await ContactPurchaseService.getContactPurchaseById(
      id
    );
    if (!contactPurchase) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "ContactPurchase not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "ContactPurchase retrieved successfully",
        data: contactPurchase,
      });
    }
  }),
  getContactPurchaseByToken: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const contactPurchase =
      await ContactPurchaseService.getContactPurchaseByToken(userId);
    if (!contactPurchase) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "ContactPurchase not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "ContactPurchase retrieved successfully",
        data: contactPurchase,
      });
    }
  }),

  createContactPurchase: catchAsync(async (req: Request, res: Response) => {
    const { bio_user } = req.body;

    if (!req?.user?._id) {
      throw new Error("You are not authorized");
    }
    const user = req.user._id;

    // Start a session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check points of user info model
      const userInfo: any = await UserInfoModel.findById(user).session(session);
      if (!userInfo) {
        await session.abortTransaction();
        session.endSession();
        return res.status(httpStatus.NOT_FOUND).json({
          statusCode: httpStatus.NOT_FOUND,
          message: "User info not found",
          success: false,
        });
      }

      // Check existing contact purchase with same user_id and bio_id
      const existingContactPurchase =
        await ContactPurchaseService.getContactPurchaseByUserAndBioUser(
          user,
          bio_user,
          { session }
        );
      if (existingContactPurchase) {
        await session.abortTransaction();
        session.endSession();
        return res.status(httpStatus.BAD_REQUEST).json({
          statusCode: httpStatus.BAD_REQUEST,
          message: "ContactPurchase already exists",
          success: false,
        });
      }

      // Check bio choice data status
      const bioChoice = await BioChoice.findOne({ bio_user, user }).session(
        session
      );
      if (!bioChoice || bioChoice.status !== "approved") {
        await session.abortTransaction();
        session.endSession();
        return res.status(httpStatus.BAD_REQUEST).json({
          statusCode: httpStatus.BAD_REQUEST,
          message: "Invalid action",
          success: false,
        });
      }

      if (userInfo.points < 70) {
        await session.abortTransaction();
        session.endSession();
        return res.status(httpStatus.BAD_REQUEST).json({
          statusCode: httpStatus.BAD_REQUEST,
          message: "You do not have enough points to buy",
          success: false,
        });
      }

      const contactPurchase: any = {
        user,
        bio_user,
      };

      // Create contactPurchase
      const createdContactPurchase =
        await ContactPurchaseService.createContactPurchase(contactPurchase, {
          session,
        });

      // Update user's points
      userInfo.points -= 70;
      await userInfo.save({ session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      res.status(httpStatus.CREATED).json({
        success: true,
        message: "ContactPurchase created successfully",
        data: createdContactPurchase,
      });
    } catch (error: any) {
      // Abort the transaction in case of an error
      await session.abortTransaction();
      session.endSession();
      console.error("Error creating ContactPurchase:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }),

  updateContactPurchase: catchAsync(async (req: Request, res: Response) => {
    const id = req.user?._id;
    if (!id) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const updatedFields = req.body;
    const updatedContactPurchase =
      await ContactPurchaseService.updateContactPurchase(id, updatedFields);
    if (!updatedContactPurchase) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "ContactPurchase not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "ContactPurchase updated successfully",
        data: updatedContactPurchase,
      });
    }
  }),

  deleteContactPurchase: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    await ContactPurchaseService.deleteContactPurchase(id);
    res.status(httpStatus.OK).json({
      success: true,
      message: "ContactPurchase deleted successfully",
    });
  }),
};
