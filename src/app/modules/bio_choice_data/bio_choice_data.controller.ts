import { sendSuccess } from "./../../../shared/SendSuccess";
import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { UserInfoModel } from "../user_info/user_info.model";
import mongoose, { Schema, ObjectId } from "mongoose";
import { BioChoiceService } from "./bio_choice_data.services";
import ApiError from "../../middlewares/ApiError";
import BioChoice from "./bio_choice_data.model";
import ContactPurchase from "../contact_purchase_data/contact_purchase_data.model";
import sendEmail from "../../../shared/SendEmail";
import { getCurrentTime } from "../../../shared/time";

export const BioChoiceController = {
  getAllBioChoices: catchAsync(async (req: Request, res: Response) => {
    const bioChoices = await BioChoiceService.getAllBioChoices();
    res.status(httpStatus.OK).json({
      success: true,
      message: "All bioChoices retrieved successfully",
      data: bioChoices,
    });
  }),

  getBioChoicesByAdmin: catchAsync(async (req: Request, res: Response) => {
    const { status = "pending", page = 1, limit = 10 } = req.query;

    const matchStage = status ? { status } : {};

    const skip = (Number(page) - 1) * Number(limit);
    const limitNum = Number(limit);

    const bioChoices = await BioChoice.aggregate([
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
          bio_details: 1,
          feedback: 1,
          bio_input: 1,
          status: 1,
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

    const totalCount = await BioChoice.countDocuments(matchStage); // Count total documents after filtering

    res.status(200).json({
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: Number(page),
      size: totalCount,
      data: bioChoices,
    });
  }),

  getBioChoiceById: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const bioChoice = await BioChoiceService.getBioChoiceById(id);
    if (!bioChoice) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "BioChoice not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "BioChoice retrieved successfully",
        data: bioChoice,
      });
    }
  }),

  getBioChoiceDataOfFirstStep: catchAsync(async (req, res) => {
    const user_id = req.user?._id;

    const mongo_user_id = new mongoose.Types.ObjectId(String(user_id));

    const results = await BioChoice.aggregate([
      {
        $match: {
          user: mongo_user_id,
          bio_user: { $ne: mongo_user_id },
        },
      },
      {
        $lookup: {
          from: "addresses",
          localField: "bio_user",
          foreignField: "user",
          as: "address",
        },
      },
      { $unwind: "$address" },
      {
        $lookup: {
          from: "users",
          localField: "bio_user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "contactpurchases",
          let: { bio_id: "$bio_user" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$bio_user", "$$bio_id"] },
                user: mongo_user_id,
              },
            },
          ],
          as: "contact_purchase",
        },
      },
      { $match: { contact_purchase: { $eq: [] } } },
      {
        $group: {
          _id: "$bio_user",
          permanent_area: { $first: "$address.permanent_area" },
          present_area: { $first: "$address.present_area" },
          zilla: { $first: "$address.zilla" },
          bio_id: { $first: "$user.user_id" },
          upzilla: { $first: "$address.upzilla" },
          division: { $first: "$address.division" },
          city: { $first: "$address.city" },
          status: { $first: "$status" },
          feedback: { $first: "$feedback" },
          bio_details: { $first: "$bio_details" },
        },
      },
      {
        $project: {
          _id: 0,
          bio_user: "$_id",
          bio_id: 1,
          permanent_area: 1,
          present_area: 1,
          zilla: 1,
          upzilla: 1,
          division: 1,
          city: 1,
          status: 1,
          feedback: 1,
          bio_details: 1,
        },
      },
    ]).exec();

    res.status(201).json({
      success: true,
      message: "Bio Choice first step data retrieved successfully",
      data: results,
    });
  }),
  getBioChoiceDataOfSecondStep: catchAsync(async (req, res) => {
    const user_id = req.user?._id;

    const mongo_user_id = new mongoose.Types.ObjectId(String(user_id));

    const results = await ContactPurchase.aggregate([
      {
        $match: {
          user: mongo_user_id,
          bio_user: { $ne: mongo_user_id },
        },
      },
      {
        $lookup: {
          from: "addresses",
          localField: "bio_user",
          foreignField: "user",
          as: "address",
        },
      },
      { $unwind: "$address" },
      {
        $lookup: {
          from: "generalinfos",
          localField: "bio_user",
          foreignField: "user",
          as: "generalinfo",
        },
      },
      { $unwind: "$generalinfo" },
      {
        $lookup: {
          from: "contacts",
          localField: "bio_user",
          foreignField: "user",
          as: "contact",
        },
      },
      { $unwind: "$contact" },
      {
        $lookup: {
          from: "users",
          localField: "bio_user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $group: {
          _id: "$bio_user",
          permanent_area: { $first: "$address.permanent_area" },
          present_area: { $first: "$address.present_area" },
          zilla: { $first: "$address.zilla" },
          bio_id: { $first: "$user.user_id" },
          upzilla: { $first: "$address.upzilla" },
          division: { $first: "$address.division" },
          full_name: { $first: "$contact.full_name" },
          family_number: { $first: "$contact.family_number" },
          relation: { $first: "$contact.relation" },
          bio_receiving_email: { $first: "$contact.bio_receiving_email" },
          date_of_birth: { $first: "$generalinfo.date_of_birth" },
          city: { $first: "$address.city" },
          status: { $first: "$status" },
          feedback: { $first: "$feedback" },
          bio_details: { $first: "$bio_details" },
        },
      },
      {
        $project: {
          _id: 0,
          bio_user: "$_id",
          bio_id: 1,
          permanent_area: 1,
          present_area: 1,
          zilla: 1,
          upzilla: 1,
          division: 1,
          city: 1,
          status: 1,
          feedback: 1,
          bio_details: 1,
          full_name: 1,
          family_number: 1,
          relation: 1,
          bio_receiving_email: 1,
          date_of_birth: 1,
        },
      },
    ]).exec();

    res.status(201).json({
      success: true,
      message: "Bio Choice first step data retrieved successfully",
      data: results,
    });
  }),

  getBioChoiceStatisticsData: catchAsync(async (req, res) => {
    const bio_user = req.params?.bio_user;

    const mongoBioId = new mongoose.Types.ObjectId(bio_user);
    const results = await BioChoice.aggregate([
      { $match: { bio_user: mongoBioId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          totalCount: { $sum: "$count" },
          counts: { $push: { status: "$_id", count: "$count" } },
        },
      },
      {
        $project: {
          _id: 0,
          totalCount: 1,
          counts: {
            $arrayToObject: {
              $map: {
                input: "$counts",
                as: "item",
                in: {
                  k: "$$item.status",
                  v: "$$item.count",
                },
              },
            },
          },
        },
      },
    ]);
    // console.log("results~~", results);

    const data = results[0] || { totalCount: 0, counts: {} };
    const totalCount = data.totalCount;
    const { rejected = 0, approved = 0, pending = 0 } = data.counts;

    if (totalCount === 0) {
      return res.status(200).json({
        success: true,
        results: {
          rejected: 0,
          approved: 0,
          pending: 0,
          rejectedPercentage: 0,
          approvedPercentage: 0,
          pendingPercentage: 0,
        },
        message: "No data found for the given bio_id",
      });
    }

    const responseResults = {
      rejected: rejected,
      approved: approved,
      pending: pending,
      rejectedPercentage: ((rejected / totalCount) * 100).toFixed(2),
      approvedPercentage: ((approved / totalCount) * 100).toFixed(2),
      pendingPercentage: ((pending / totalCount) * 100).toFixed(2),
    };

    res.status(200).json({
      success: true,
      results: responseResults,
      message: "All statistics retrieved successfully",
    });
  }),
  getBioChoiceByToken: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const bioChoice = await BioChoiceService.getBioChoiceByToken(userId);
    if (!bioChoice) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "BioChoice not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "BioChoice retrieved successfully",
        data: bioChoice,
      });
    }
  }),

  getBioChoiceDataOfShare: catchAsync(async (req: Request, res: Response) => {
    const bio_user = req.user?._id;
    // console.log("bio_user~~", bio_user);
    if (!bio_user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const mongoId = new mongoose.Types.ObjectId(String(bio_user));
    const data: any = await BioChoice.aggregate([
      { $match: { bio_user: mongoId } },
      {
        $lookup: {
          from: "generalinfos", // Name of the GeneralInfo collection
          localField: "user",
          foreignField: "user",
          as: "general_info",
        },
      },
      { $unwind: "$general_info" },
      {
        $lookup: {
          from: "addresses", // Name of the Address collection
          localField: "user",
          foreignField: "user",
          as: "address",
        },
      },
      { $unwind: "$address" },
      {
        $lookup: {
          from: "users", // Name of the Address collection
          localField: "user",
          foreignField: "_id",
          as: "users",
        },
      },
      { $unwind: "$users" },
      {
        $project: {
          user_id: "$users.user_id",
          user: "$users._id",
          date_of_birth: "$general_info.date_of_birth",
          status: 1,
          feedback: 1,
          bio_details: 1,
          present_address: "$address.present_address",
          city: "$address.city",
          present_area: "$address.present_area",
        },
      },
    ]);
    // const data = await BioChoice.findOne({
    //   bio_user,
    // });
    res.json(sendSuccess("Retrieve bio share successfully", data, 200));
  }),

  // createBioChoice: catchAsync(async (req: Request, res: Response) => {
  //   const data = req.body;
  //   const user = req.user?._id;

  //   // for un authorized check
  //   if (!user) {
  //     return res.status(httpStatus.UNAUTHORIZED).json({
  //       statusCode: httpStatus.UNAUTHORIZED,
  //       message: "You are not authorized",
  //       success: false,
  //     });
  //   }

  //   // check exists
  //   const bioChoice = await BioChoiceService.checkBioChoiceExist({
  //     user: user,
  //     bio_user: data.bio_user,
  //   });

  //   if (bioChoice) {
  //     return res.status(httpStatus.CONFLICT).json({
  //       success: false,
  //       message: "BioChoice already exists",
  //     });
  //   }

  //   data.user = user;

  //   const userInfo: any = await UserInfoModel.findOne({ user: user });
  //   if (userInfo.points < 30) {
  //     throw new ApiError(httpStatus.FORBIDDEN, "You have less than 30 points");
  //   }
  //   userInfo.points = userInfo.points - 30;
  //   await userInfo.save();
  //   const response = await BioChoiceService.createBioChoice(data);

  //   res.json({
  //     success: true,
  //     message: "BioChoice created successfully",
  //     data: response,
  //   });
  // }),

  createBioChoice: catchAsync(async (req: Request, res: Response) => {
    const data = req.body;
    const user = req.user?._id;

    // for unauthorized check
    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }

    // Start a session and transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check if the BioChoice already exists
      const bioChoice = await BioChoiceService.checkBioChoiceExist({
        user: user,
        bio_user: data.bio_user,
      });

      if (bioChoice) {
        await session.abortTransaction();
        return res.status(httpStatus.CONFLICT).json({
          success: false,
          message: "BioChoice already exists",
        });
      }

      data.user = user;

      // Fetch user info and check points

      const userInfo: any = await UserInfoModel.findById(user).session(session);
      const bioUserInfo = await UserInfoModel.findById(data.bio_user).session(
        session
      );

      if (!userInfo || userInfo.points < 30) {
        await session.abortTransaction();
        return res.status(httpStatus.FORBIDDEN).json({
          success: false,
          message: "You have less than 30 points",
        });
      }
      if (!bioUserInfo) {
        await session.abortTransaction();
        return res.status(httpStatus.FORBIDDEN).json({
          success: false,
          message: "Bio user not found",
        });
      }

      // Deduct points and save user info
      const points = userInfo.points - 30;
      userInfo.points = points;
      await userInfo.save({ session });

      // Create the BioChoice
      const response: any = await BioChoiceService.createBioChoice(data, {
        session,
      });

      const date = getCurrentTime();

      const bioHtml = `
      <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Notification of Bio 1st Step Purchase</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    padding: 20px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                .header {
                    background-color: #071952;
                    color: white;
                    padding: 10px 0;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                }
                .content {
                    padding: 20px;
                }
                .content h2 {
                    color: #333;
                }
                .content p {
                    color: #666;
                }
                .details {
                    background-color: #f9f9f9;
                    padding: 10px;
                    margin: 20px 0;
                    border: 1px solid #ddd;
                }
                .details p {
                    margin: 5px 0;
                }
                .footer {
                    text-align: center;
                    padding: 10px;
                    background-color: #071952;
                    color: white;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Bio 1st Step Purchase Notification</h1>
                </div>
                <div class="content">
                    <h2>Dear Sir/Mam,</h2>
                    <p>We are pleased to inform you that the first step of your bio has been purchased.p . Below are the details</p>
                    <div class="details">
                        <p>Purchased By[Bio Id]: ${userInfo.user_id}</p>
                        <p>Purchase Date: ${date}</p>
                    </div>
                    <p>Please,Give the feedback so that he/she can proceed for the next step</p>
                    <p>If you have any questions or need further assistance, please do not hesitate to contact our support team.</p>
                </div>
                <div class="footer">
                    <p>Best regards,<br>
                    PNC-Nikah<br>
                    pnc.nikah@gmail.com</p>
                </div>
            </div>
        </body>
        </html>
      `;

      const userHtml = `
      <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirmation Email</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    padding: 20px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                .header {
                    background-color: #071952;
                    color: white;
                    padding: 10px 0;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                }
                .content {
                    padding: 20px;
                }
                .content h2 {
                    color: #333;
                }
                .content p {
                    color: #666;
                }
                .details {
                    background-color: #f9f9f9;
                    padding: 10px;
                    margin: 20px 0;
                    border: 1px solid #ddd;
                }
                .details p {
                    margin: 5px 0;
                }
                .footer {
                    text-align: center;
                    padding: 10px;
                    background-color: #071952;
                    color: white;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Confirmation of Your Purchase</h1>
                </div>
                <div class="content">
                    <h2>Dear Sir/Mam,</h2>
                    <p>We are pleased to inform you that your purchase of the <strong>"Bio 1st Step"</strong> has been successfully completed. A total of 30 points have been deducted from your account for this transaction.</p>
                    <div class="details">
                        <p><strong>ChoiceId: ${response._id}</strong></p>
                        <p>Item Purchased: Bio 1st Step</p>
                        <p>Bio ID: ${bioUserInfo.user_id}</p>
                        <p>Points Deducted: 30 points</p>
                        <p>Remaining Points: ${points}</p>
                        <p>Purchase Date: ${date}</p>
                    </div>
                    <p>Thank you for your purchase! If you have any questions or need further assistance, please do not hesitate to contact our support team.</p>
                </div>
                <div class="footer">
                    <p>Best regards,<br>
                    PNC-Nikah<br>
                    pnc.nikah@gmail.com</p>
                </div>
            </div>
        </body>
        </html>

      `;
      await sendEmail(
        userInfo.email,
        "Confirmation of Your `Bio 1st Step` Purchase",
        userHtml
      );
      await sendEmail(
        bioUserInfo.email,
        "Notification of Bio 1st Step Purchase",
        bioHtml
      );

      // Commit the transaction
      await session.commitTransaction();
      return res.json({
        success: true,
        message: "BioChoice created successfully",
        data: response,
      });
    } catch (error) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error("Error aborting transaction:", abortError);
      }
      console.error("Error creating BioChoice:", error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error",
      });
    } finally {
      session.endSession();
    }
  }),

  checkBioChoiceDataOfFirstStep: catchAsync(
    async (req: Request, res: Response) => {
      const user = req.user?._id;
      const bio_user = req.params.id;
      if (!user) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          statusCode: httpStatus.UNAUTHORIZED,
          message: "You are not authorized",
          success: false,
        });
      }

      const checkBioChoice =
        await BioChoiceService.checkBioChoiceDataOfFirstStep({
          bio_user,
          user,
        });
      if (!checkBioChoice) {
        res.status(httpStatus.NOT_FOUND).json({
          success: false,
          message: "BioChoice not found",
        });
      } else {
        res.status(httpStatus.OK).json({
          success: true,
          message: "Check BioChoice first step successfully",
          data: {
            status: checkBioChoice?.status,
          },
        });
      }
    }
  ),
  checkBioChoiceDataOfSecondStep: catchAsync(
    async (req: Request, res: Response) => {
      const user = req.user?._id;
      const bio_user = req.params.id;

      if (!user) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          statusCode: httpStatus.UNAUTHORIZED,
          message: "You are not authorized",
          success: false,
        });
      }

      // Use aggregation with lookup to get contact info
      const checkBioChoice = await ContactPurchase.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(String(user)),
            bio_user: new mongoose.Types.ObjectId(bio_user),
          },
        },
        {
          $lookup: {
            from: "contacts", // The name of the contacts collection
            localField: "bio_user",
            foreignField: "user",
            as: "contact_info",
          },
        },
        {
          $unwind: {
            path: "$contact_info",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            user: 1,
            bio_user: 1,
            "contact_info.bio_receiving_email": 1,
            "contact_info.relation": 1,
            "contact_info.family_number": 1,
            "contact_info.full_name": 1,
          },
        },
      ]);

      if (!checkBioChoice.length) {
        return res.status(httpStatus.NOT_FOUND).json({
          success: false,
          message: "BioChoice contact info not found",
        });
      }

      res.status(httpStatus.OK).json({
        success: true,
        message: "Check BioChoice second step successfully",
        data: checkBioChoice[0],
      });
    }
  ),
  updateBioChoice: catchAsync(async (req: Request, res: Response) => {
    const bio_user = req.user?._id;
    const { user, ...others } = req.body;
    if (!bio_user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }

    const updatedBioChoice = await BioChoiceService.updateBioChoice(
      { bio_user, user },
      others
    );
    if (!updatedBioChoice) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "BioChoice not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "BioChoice updated successfully",
        data: updatedBioChoice,
      });
    }
  }),

  deleteBioChoice: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    await BioChoiceService.deleteBioChoice(id);
    res.status(httpStatus.OK).json({
      success: true,
      message: "BioChoice deleted successfully",
    });
  }),
};
