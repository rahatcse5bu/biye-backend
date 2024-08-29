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
import sendEmail from "../../../shared/SendEmail";
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
      const { status, page = 1, limit = 10 } = req.query;

      const matchStage = status ? { status } : {};

      const skip = (Number(page) - 1) * Number(limit);
      const limitNum = Number(limit);

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

      const totalCount = await ContactPurchase.countDocuments(matchStage); // Count total documents after filtering

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

      // bio html

      const bioHtml = `
      <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                }
                .container {
                    width: 100%;
                    max-width: 600px;
                    margin: auto;
                    padding: 20px;
                    border: 1px solid #e0e0e0;
                    border-radius: 10px;
                }
                .header {
                    background-color: #4CAF50;
                    color: white;
                    padding: 10px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }
                .content {
                    padding: 20px;
                }
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    color: #888;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Contact Information Shared</h1>
                </div>
                <div class="content">
                    <p>Dear Sir/Mam,</p>
                    <p>We wanted to inform you that your contact information has been purchased using points on our platform.</p>
                    <p>Here are the details:</p>
                    <ul>
                        <li><strong>Buyer's BioId:</strong> ${userInfo.user_id}</li>
                        <li><strong>Email:</strong>${userInfo.email}</li>
                    </ul>
                    <p>If you have any questions or concerns, please reach out to our support team.</p>
                    <p>Thank you for being a part of our community!</p>
                    <p>Best Regards,</p>
                    <p>[Your Company Name]</p>
            <p><a href="http://www.pnc-nikah.com">Visit our website</a> for more information.</p>

                </div>
                <div class="footer">
                    <p>&copy; 2024 PNC-Nikah. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>

      
      `;

      await sendEmail(bioUser.email, "Contact Information Shared", bioHtml);

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

      const userHtml = `
    <!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: auto;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 10px;
        }
        .header {
            background-color: #4CAF50;
            color: white;
            padding: 10px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            padding: 20px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Purchase Confirmation</h1>
        </div>
        <div class="content">
            <p>Dear Sir/Mam,</p>
            <p>Thank you for your purchase!</p>
            <p>You have successfully bought the contact information of ${bioContact.full_name} using your 70 points.now you have ${points} points. </p>
            <p>Here are the details:</p>
            <ul>
                <li><strong>Full Name:</strong> ${bioContact.full_name}</li>
                <li><strong>Email:</strong> ${bioContact.bio_receiving_email}</li>
                <li><strong>Phone:</strong> ${bioContact.family_number}</li>
            </ul>
            <p>If you have any questions, feel free to contact our support team.</p>
            <p>Thank you for using our service!</p>
            <p>Best Regards,</p>
            <p>PNC-Nikah</p>
            <p><a href="http://www.pnc-nikah.com">Visit our website</a> for more information.</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 PNC-Nikah. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  
      `;

      await sendEmail(userInfo.email, "Purchase Confirmation", userHtml);

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
