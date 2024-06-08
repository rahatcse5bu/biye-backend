import { sendSuccess } from "./../../../shared/SendSuccess";
import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { UserInfoModel } from "../user_info/user_info.model";
import mongoose from "mongoose";
import { BioChoiceService } from "./bio_choice_data.services";
import ApiError from "../../middlewares/ApiError";
import BioChoice from "./bio_choice_data.model";
import ContactPurchase from "../contact_purchase_data/contact_purchase_data.model";

export const BioChoiceController = {
  getAllBioChoices: catchAsync(async (req: Request, res: Response) => {
    const bioChoices = await BioChoiceService.getAllBioChoices();
    res.status(httpStatus.OK).json({
      success: true,
      message: "All bioChoices retrieved successfully",
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

  getBioChoiceDataOfFirstStep: catchAsync(
    async (req: Request, res: Response) => {
      const user = req.user?._id;

      if (!user) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          success: false,
          message: "You are not authorized",
        });
      }

      const mongoUserId = new mongoose.Types.ObjectId(user);
      const mongoBioUserId = new mongoose.Types.ObjectId(user);

      // const data = await BioChoice.aggregate([
      //   {
      //     $match: {
      //       user: mongoUserId,
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: "addresses",
      //       localField: "bio_user",
      //       foreignField: "user",
      //       as: "address",
      //     },
      //   },
      //   { $unwind: "$address" },
      //   {
      //     $lookup: {
      //       from: "biochoices",
      //       localField: "bio_user",
      //       foreignField: "user",
      //       as: "main",
      //     },
      //   },
      //   {
      //     $unwind: { path: "$main", preserveNullAndEmptyArrays: true },
      //   },
      //   {
      //     $match: {
      //       bio_user: {
      //         $nin: await ContactPurchase.find(
      //           { user: mongoUserId },
      //           "bio_user"
      //         ).distinct("bio_user"),
      //       },
      //     },
      //   },
      //   {
      //     $group: {
      //       _id: "$bio_user",
      //       bio_user: { $first: "$bio_user" },
      //       permanent_area: { $first: "$address.permanent_area" },
      //       present_area: { $first: "$address.present_area" },
      //       zilla: { $first: "$address.zilla" },
      //       upzilla: { $first: "$address.upzilla" },
      //       division: { $first: "$address.division" },
      //       city: { $first: "$address.city" },
      //       status: { $first: "$status" },
      //       feedback: { $first: "$feedback" },
      //       bio_details: { $first: "$bio_details" },
      //       total_count: { $sum: 1 },
      //       approval_count: {
      //         $sum: {
      //           $cond: [{ $eq: ["$main.status", "approved"] }, 1, 0],
      //         },
      //       },
      //       rejection_count: {
      //         $sum: {
      //           $cond: [{ $eq: ["$main.status", "rejected"] }, 1, 0],
      //         },
      //       },
      //       pending_count: {
      //         $sum: {
      //           $cond: [{ $eq: ["$main.status", "pending"] }, 1, 0],
      //         },
      //       },
      //     },
      //   },
      //   {
      //     $project: {
      //       bio_user: 1,
      //       permanent_area: 1,
      //       present_area: 1,
      //       zilla: 1,
      //       upzilla: 1,
      //       division: 1,
      //       city: 1,
      //       status: 1,
      //       feedback: 1,
      //       bio_details: 1,
      //       total_count: 1,
      //       approval_count: 1,
      //       rejection_count: 1,
      //       pending_count: 1,
      //       approval_rate: {
      //         $cond: {
      //           if: {
      //             $eq: [{ $subtract: ["$total_count", "$pending_count"] }, 0],
      //           },
      //           then: 0.0,
      //           else: {
      //             $multiply: [
      //               {
      //                 $divide: [
      //                   "$approval_count",
      //                   { $subtract: ["$total_count", "$pending_count"] },
      //                 ],
      //               },
      //               100.0,
      //             ],
      //           },
      //         },
      //       },
      //       rejection_rate: {
      //         $cond: {
      //           if: {
      //             $eq: [{ $subtract: ["$total_count", "$pending_count"] }, 0],
      //           },
      //           then: 0.0,
      //           else: {
      //             $multiply: [
      //               {
      //                 $divide: [
      //                   "$rejection_count",
      //                   { $subtract: ["$total_count", "$pending_count"] },
      //                 ],
      //               },
      //               100.0,
      //             ],
      //           },
      //         },
      //       },
      //     },
      //   },
      // ]);

      const data = await BioChoice.aggregate([
        {
          $match: {
            user: user,
          },
        },
        {
          $group: {
            _id: "$bio_user",
            status: { $first: "$status" },
            feedback: { $first: "$feedback" },
            bio_details: { $first: "$bio_details" },
            total_count: { $sum: 1 },
            approval_count: {
              $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] },
            },
            rejection_count: {
              $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] },
            },
            pending_count: {
              $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
            },
          },
        },
        {
          $lookup: {
            from: "address",
            localField: "_id",
            foreignField: "user",
            as: "address",
          },
        },
        {
          $unwind: "$address",
        },
        {
          $match: {
            "address.user": {
              $nin: await ContactPurchase.distinct("bio_user", {
                user: user,
              }),
            },
          },
        },
        {
          $project: {
            bio_id: "$_id",
            permanent_area: "$address.permanent_area",
            present_area: "$address.present_area",
            zilla: "$address.zilla",
            upzilla: "$address.upzilla",
            division: "$address.division",
            city: "$address.city",
            status: 1,
            feedback: 1,
            bio_details: 1,
            total_count: 1,
            approval_count: 1,
            rejection_count: 1,
            pending_count: 1,
            approval_rate: {
              $cond: [
                { $eq: ["$total_count", "$pending_count"] },
                0,
                {
                  $multiply: [
                    {
                      $divide: [
                        { $multiply: ["$approval_count", 100] },
                        { $subtract: ["$total_count", "$pending_count"] },
                      ],
                    },
                    1.0,
                  ],
                },
              ],
            },
            rejection_rate: {
              $cond: [
                { $eq: ["$total_count", "$pending_count"] },
                0,
                {
                  $multiply: [
                    {
                      $divide: [
                        { $multiply: ["$rejection_count", 100] },
                        { $subtract: ["$total_count", "$pending_count"] },
                      ],
                    },
                    1.0,
                  ],
                },
              ],
            },
          },
        },
      ]).exec();
      res.json(sendSuccess("Retrieve first bio", data, 200));
    }
  ),

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
    console.log("bio_user~~", bio_user);
    if (!bio_user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const mongoId = new mongoose.Types.ObjectId(bio_user);
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

      const userInfo = await UserInfoModel.findById(user).session(session);
      if (!userInfo || userInfo.points < 30) {
        await session.abortTransaction();
        return res.status(httpStatus.FORBIDDEN).json({
          success: false,
          message: "You have less than 30 points",
        });
      }

      // Deduct points and save user info
      userInfo.points -= 30;
      await userInfo.save({ session });

      // Create the BioChoice
      const response = await BioChoiceService.createBioChoice(data, {
        session,
      });

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
