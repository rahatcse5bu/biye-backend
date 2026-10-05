import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { UserInfoModel } from "../user_info/user_info.model";
import mongoose from "mongoose";
import { ContactPurchaseService } from "./contact_purchase_data.services";
import ApiError from "../../middlewares/ApiError";
import { IContactPurchase } from "./contact_purchase_data.interface";
import BioChoice from "../bio_choice_data/bio_choice_data.model";
import Contact from "../contact/contact.model";
import { mailUser } from "../../../shared/bibahoMail";
import { NotificationService } from "../notifications/notification.service";
import ContactPurchase from "./contact_purchase_data.model";

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

  getAllContactPurchasesByAdmin: catchAsync(
    async (req: Request, res: Response) => {
      const { status, page = 1, limit = 10, search } = req.query;

      const matchStage: any = status ? { status } : {};

      const skip = (Number(page) - 1) * Number(limit);
      const limitNum = Number(limit);

      // Build search match stage if search query provided
      const searchMatchStage = search
        ? {
            $or: [
              { "userDetails.email": { $regex: search, $options: "i" } },
              { "bioUserDetails.email": { $regex: search, $options: "i" } },
              { "userDetails.user_id": isNaN(Number(search)) ? undefined : Number(search) },
              { "bioUserDetails.user_id": isNaN(Number(search)) ? undefined : Number(search) },
            ].filter((condition) => {
              const values = Object.values(condition);
              return values.every((v) => v !== undefined);
            }),
          }
        : null;

      const contactPurchases = await ContactPurchase.aggregate([
        {
          $lookup: {
            from: "contacts", // The collection name for Contact model
            localField: "user",
            foreignField: "user",
            as: "userContact",
          },
        },
        {
          $lookup: {
            from: "contacts", // The collection name for Contact model
            localField: "bio_user",
            foreignField: "user",
            as: "bioUserContact",
          },
        },
        {
          $lookup: {
            from: "users", // The collection name for User model
            localField: "user",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $lookup: {
            from: "users", // The collection name for User model
            localField: "bio_user",
            foreignField: "_id",
            as: "bioUserDetails",
          },
        },
        {
          $unwind: "$userContact",
        },
        {
          $unwind: "$bioUserContact",
        },
        {
          $unwind: "$bioUserDetails",
        },
        {
          $unwind: "$userDetails",
        },
        {
          $match: matchStage,
        },
        ...(searchMatchStage ? [{ $match: searchMatchStage }] : []),
        {
          $project: {
            _id: 1,
            user: 1,
            bio_user: 1,
            createdAt: 1,
            updatedAt: 1,
            userContact: {
              _id: 1,
              full_name: 1,
              family_number: 1,
              relation: 1,
              bio_receiving_email: 1,
            },
            bioUserContact: {
              _id: 1,
              full_name: 1,
              family_number: 1,
              relation: 1,
              bio_receiving_email: 1,
            },
            userDetails: {
              user_id: 1,
              user_status: 1,
              email: 1,
              points: 1,
            },
            bioUserDetails: {
              user_id: 1,
              user_status: 1,
              email: 1,
              points: 1,
            },
          },
        },
        {
          $sort: {
            createdAt: -1, // Sort by `createdAt` in descending order
          },
        },
        {
          $skip: skip, // Skip the number of documents for pagination
        },
        {
          $limit: limitNum, // Limit the number of documents returned
        },
      ]);

      // Build count pipeline (same filters as data pipeline but without skip/limit)
      const countPipeline: any[] = [
        {
          $lookup: {
            from: "contacts",
            localField: "user",
            foreignField: "user",
            as: "userContact",
          },
        },
        {
          $lookup: {
            from: "contacts",
            localField: "bio_user",
            foreignField: "user",
            as: "bioUserContact",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "bio_user",
            foreignField: "_id",
            as: "bioUserDetails",
          },
        },
        { $unwind: "$userContact" },
        { $unwind: "$bioUserContact" },
        { $unwind: "$bioUserDetails" },
        { $unwind: "$userDetails" },
        { $match: matchStage },
        ...(searchMatchStage ? [{ $match: searchMatchStage }] : []),
        { $count: "total" },
      ];

      const countResult = await ContactPurchase.aggregate(countPipeline);
      const totalCount = countResult.length > 0 ? countResult[0].total : 0;

      res.status(200).json({
        totalPages: Math.ceil(totalCount / limitNum),
        currentPage: Number(page),
        totalItems: totalCount,
        data: contactPurchases,
      });
    }
  ),

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
    if (!bio_user) {
      throw new Error("Invalid Data");
    }
    const user = req.user._id;

    // Start a session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check points of user info model
      const userInfo: any = await UserInfoModel.findById(user).session(session);
      const bioUser: any = await UserInfoModel.findById(bio_user).session(
        session
      );
      if (!userInfo) {
        await session.abortTransaction();
        session.endSession();
        return res.status(httpStatus.NOT_FOUND).json({
          statusCode: httpStatus.NOT_FOUND,
          message: "User info not found",
          success: false,
        });
      }
      if (!bioUser) {
        await session.abortTransaction();
        session.endSession();
        return res.status(httpStatus.NOT_FOUND).json({
          statusCode: httpStatus.NOT_FOUND,
          message: "Bio User not found",
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
      const points = userInfo.points - 70;
      userInfo.points = points;
      await userInfo.save({ session });


      // user html

      const bioContact: any = await Contact.findOne({ user: bio_user }).session(
        session
      );

      if (!bioContact) {
        await session.abortTransaction();
        session.endSession();
        return res.status(httpStatus.NOT_FOUND).json({
          statusCode: httpStatus.NOT_FOUND,
          message: "Bio Contact not found",
          success: false,
        });
      }


      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      // TODO: emails only after the purchase is saved; buyer gets the contact, owner gets a heads-up.
      mailUser(userInfo.email, "অভিভাবকের যোগাযোগ তথ্য", {
        title: "আপনার কেনা যোগাযোগ তথ্য",
        tone: "success",
        paragraphs: [
          "ধন্যবাদ! নিচে পাত্র/পাত্রীর অভিভাবকের যোগাযোগ তথ্য দেওয়া হলো। এই তথ্য আপনার অ্যাকাউন্টের \"ক্রয়কৃত\" অংশেও সবসময় দেখতে পাবেন।",
          "অনুগ্রহ করে শালীনতা বজায় রেখে যোগাযোগ করুন।",
        ],
        details: [
          { label: "বায়োডাটা নং", value: bioUser.user_id },
          { label: "অভিভাবকের নাম", value: bioContact.full_name },
          { label: "সম্পর্ক", value: bioContact.relation },
          { label: "মোবাইল নম্বর", value: bioContact.family_number },
          { label: "ইমেইল", value: bioContact.bio_receiving_email },
          { label: "খরচ হওয়া পয়েন্ট", value: 70 },
          { label: "অবশিষ্ট পয়েন্ট", value: points },
        ],
        action: { label: "ক্রয়কৃত বায়োডাটা দেখুন", path: "/user/account/purchases" },
      });
      mailUser(bioUser.email, "আপনার অভিভাবকের যোগাযোগ তথ্য নেওয়া হয়েছে", {
        title: "একজন সদস্য আপনার অভিভাবকের যোগাযোগ তথ্য নিয়েছেন",
        paragraphs: [
          "আপনার প্রস্তাবে সম্মতির পর একজন সদস্য আপনার অভিভাবকের যোগাযোগ তথ্য নিয়েছেন। শীঘ্রই তিনি আপনার অভিভাবকের সাথে যোগাযোগ করতে পারেন।",
        ],
        details: [{ label: "সদস্যের বায়োডাটা নং", value: userInfo.user_id }],
        action: { label: "ড্যাশবোর্ড দেখুন", path: "/user/account/dashboard" },
      });
      NotificationService.notify({
        recipient: String(bioUser._id),
        audience: "user",
        type: "biodata",
        title: "যোগাযোগ তথ্য নেওয়া হয়েছে",
        message: `বায়োডাটা নং ${userInfo.user_id} আপনার অভিভাবকের যোগাযোগ তথ্য নিয়েছেন।`,
        link: "/user/account/bio-requests",
      });
      NotificationService.notify({
        recipient: String(userInfo._id),
        audience: "user",
        type: "payment",
        title: "যোগাযোগ তথ্য কেনা সম্পন্ন",
        message: `বায়োডাটা নং ${bioUser.user_id}-এর অভিভাবকের যোগাযোগ তথ্য আপনার ক্রয়কৃত তালিকায় যোগ হয়েছে।`,
        link: "/user/account/purchases",
      });
      NotificationService.notify({
        audience: "admin",
        type: "payment",
        title: "যোগাযোগ তথ্য বিক্রি হয়েছে",
        message: `বায়োডাটা নং ${userInfo.user_id} কিনেছেন বায়োডাটা নং ${bioUser.user_id}-এর অভিভাবকের যোগাযোগ তথ্য (৭০ পয়েন্ট)।`,
        link: "/contact-purchases",
      });

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
