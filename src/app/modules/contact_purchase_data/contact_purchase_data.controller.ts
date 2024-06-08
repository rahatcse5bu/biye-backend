import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { UserInfoModel } from "../user_info/user_info.model";
import mongoose from "mongoose";
import { ContactPurchaseService } from "./contact_purchase_data.services";

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
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let { user_form, ...contactPurchaseData } = req.body;
      contactPurchaseData.user = req.user?._id;

      // Create contactPurchase
      const createdContactPurchase =
        await ContactPurchaseService.createContactPurchase(
          contactPurchaseData,
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
        message: "ContactPurchase created successfully",
        data: createdContactPurchase,
      });
    } catch (error: any) {
      // If any error occurs, abort the transaction
      await session.abortTransaction();
      session.endSession();

      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "An error occurred while creating the contactPurchase",
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
