import { Request, Response } from "express";
import httpStatus from "http-status";
import { ContactService } from "./contact.services";
import catchAsync from "../../../shared/catchAsync";
import { UserInfoModel } from "../user_info/user_info.model";
import mongoose from "mongoose";
import { mailAdmins } from "../../../shared/bibahoMail";
import ContactMessage from "../contact_message/contact_message.model";
import { NotificationService } from "../notifications/notification.service";

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
    // TODO: visitor input is escaped by the template; raw HTML here let anyone send links from our address.
    const text = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);
    const input = {
      name: text(req.body?.name, 100),
      email: text(req.body?.email, 200).toLowerCase(),
      phone: text(req.body?.phone, 40),
      bio: text(req.body?.bio, 40),
      message: text(req.body?.message, 3000),
    };
    if (!input.name || !input.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "নাম, সঠিক ইমেইল এবং বার্তা দেওয়া আবশ্যক",
      });
    }

    // TODO: saved first so the admin site keeps every message even if the email fails.
    const saved = await ContactMessage.create(input);
    mailAdmins("ওয়েবসাইট থেকে নতুন বার্তা", {
      icon: "support",
      eyebrow: "অ্যাডমিন · সাপোর্ট",
      title: "যোগাযোগ ফর্ম থেকে নতুন বার্তা",
      paragraphs: ["ওয়েবসাইটের যোগাযোগ ফর্ম থেকে একটি নতুন বার্তা এসেছে।"],
      blocks: [{ type: "message", label: "বার্তা", text: input.message }],
      detailsTitle: "প্রেরকের তথ্য",
      details: [
        { label: "নাম", value: input.name },
        { label: "ইমেইল", value: input.email },
        { label: "ফোন", value: input.phone },
        { label: "বায়োডাটা নং", value: input.bio },
      ],
    });
    NotificationService.notify({
      audience: "admin",
      type: "system",
      title: "নতুন যোগাযোগ বার্তা",
      message: `${input.name} (${input.email}) একটি বার্তা পাঠিয়েছেন।`,
      link: "/contact-messages",
    });
    res.status(httpStatus.CREATED).json({ success: true, message: "Message sent successfully", data: { _id: saved._id } });
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
