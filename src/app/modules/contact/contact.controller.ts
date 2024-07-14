import { Request, Response } from "express";
import httpStatus from "http-status";
import { ContactService } from "./contact.services";
import catchAsync from "../../../shared/catchAsync";
import { UserInfoModel } from "../user_info/user_info.model";
import mongoose from "mongoose";
import { sendEmails } from "../../../shared/SendEmail";
import { adminEmails } from "../user_info/user_info.constant";

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
  createContactUsByEmail: catchAsync(async (req: Request, res: Response) => {
    const { name, email, phone, bio, message } = req.body;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                color: #333;
                margin: 0;
                padding: 0;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                padding: 10px 0;
                background: linear-gradient(to right, #4CAF50, #1E90FF);
                color: white;
                border-radius: 8px 8px 0 0;
            }
            .content {
                padding: 20px;
            }
            .content p {
                line-height: 1.6;
                margin: 10px 0;
            }
            .content .highlight {
                font-weight: bold;
                color: #333;
            }
            .footer {
                text-align: center;
                padding: 10px 0;
                font-size: 12px;
                color: #888;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>New Contact Form Submission</h2>
            </div>
            <div class="content">
                <p>Hello Admin,</p>
                <p>You have received a new message from the contact form on your website. Here are the details:</p>
                <p><span class="highlight">Name:</span> ${name}</p>
                <p><span class="highlight">Email:</span> ${email}</p>
                <p><span class="highlight">Phone:</span> ${phone}</p>
                <p><span class="highlight">Bio:</span> ${bio}</p>
                <p><span class="highlight">Message:</span> ${message}</p>
                <p>Please respond to this message as soon as possible.</p>
            </div>
           
        </div>
    </body>
    </html>
  `;

    await sendEmails(adminEmails, "New Contact Form Submission", htmlContent);
    res.json({ success: true, message: "Email sent successfully" });
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
