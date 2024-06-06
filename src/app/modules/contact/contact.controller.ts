import { Request, Response } from "express";
import httpStatus from "http-status";
import { ContactService } from "./contact.services";
import catchAsync from "../../../shared/catchAsync";
import { UserInfoModel } from "../user_info/user_info.model";
import mongoose from "mongoose";

export const ContactController = {
  getAllContacts: catchAsync(async (req: Request, res: Response) => {
    const contacts = await ContactService.getAllContacts();
    res.status(httpStatus.OK).json({
      success: true,
      message: "All contacts retrieved successfully",
      data: contacts,
    });
  }),

  getContactById: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const contact = await ContactService.getContactById(id);
    if (!contact) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Contact not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "Contact retrieved successfully",
        data: contact,
      });
    }
  }),
  getContactByToken: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const contact = await ContactService.getContactByToken(userId);
    if (!contact) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Contact not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "Contact retrieved successfully",
        data: contact,
      });
    }
  }),

  createContact: catchAsync(async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let { user_form, ...contactData } = req.body;
      contactData.user = req.user?._id;

      // Create contact
      const createdContact = await ContactService.createContact(contactData, {
        session,
      });

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
        message: "Contact created successfully",
        data: createdContact,
      });
    } catch (error: any) {
      // If any error occurs, abort the transaction
      await session.abortTransaction();
      session.endSession();

      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "An error occurred while creating the contact",
        error: error.message,
      });
    }
  }),

  updateContact: catchAsync(async (req: Request, res: Response) => {
    const id = req.user?._id;
    if (!id) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const updatedFields = req.body;
    const updatedContact = await ContactService.updateContact(
      id,
      updatedFields
    );
    if (!updatedContact) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Contact not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "Contact updated successfully",
        data: updatedContact,
      });
    }
  }),

  deleteContact: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    await ContactService.deleteContact(id);
    res.status(httpStatus.OK).json({
      success: true,
      message: "Contact deleted successfully",
    });
  }),
};
