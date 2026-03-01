import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import mongoose from "mongoose";
import Shortlist from "./shortlist.model";

export const ShortlistController = {
  // Toggle shortlist (add if not exists, remove if exists)
  toggleShortlist: catchAsync(async (req: Request, res: Response) => {
    const { bio_user } = req.body;
    const user = req.user?._id;

    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }

    if (String(user) === String(bio_user)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "You cannot shortlist yourself",
      });
    }

    const MAX_RETRIES = 3;
    let retries = 0;

    while (retries < MAX_RETRIES) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const existingShortlist = await Shortlist.findOne({
          user,
          bio_user,
        }).session(session);

        if (existingShortlist) {
          await Shortlist.findOneAndDelete({ user, bio_user }).session(session);
          await session.commitTransaction();
          session.endSession();
          return res.json({
            success: true,
            message: "Shortlist was successfully removed.",
            data: { shortlisted: false },
          });
        } else {
          await Shortlist.create([{ user, bio_user }], { session });
          await session.commitTransaction();
          session.endSession();
          return res.json({
            success: true,
            message: "Shortlist was successfully added.",
            data: { shortlisted: true },
          });
        }
      } catch (error: any) {
        await session.abortTransaction();
        session.endSession();

        if (error.code === 112) {
          retries++;
          console.warn(`Retrying shortlist transaction, attempt ${retries}`);
          await new Promise((resolve) => setTimeout(resolve, 100 * retries));
        } else {
          console.error("Error toggling shortlist:", error);
          return res.status(500).json({
            success: false,
            message: "Internal server error",
          });
        }
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to toggle shortlist after multiple attempts.",
    });
  }),

  // Get my shortlist (biodatas I shortlisted)
  getMyShortlist: catchAsync(async (req: Request, res: Response) => {
    const user = req.user?._id;
    if (!user) {
      return res.status(401).send({
        statusCode: 401,
        message: "You are not authorized",
        success: false,
      });
    }

    const user_mongo_id = new mongoose.Types.ObjectId(String(user));

    const results = await Shortlist.aggregate([
      { $match: { user: user_mongo_id, bio_user: { $ne: user_mongo_id } } },
      {
        $lookup: {
          from: "addresses",
          localField: "bio_user",
          foreignField: "user",
          as: "address",
        },
      },
      { $unwind: { path: "$address", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "bio_user",
          foreignField: "_id",
          as: "user_info",
        },
      },
      { $unwind: { path: "$user_info", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "generalinfos",
          localField: "bio_user",
          foreignField: "user",
          as: "general_info",
        },
      },
      { $unwind: { path: "$general_info", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          bio_id: "$user_info.user_id",
          bio_user: "$bio_user",
          permanent_address: "$address.permanent_address",
          date_of_birth: "$general_info.date_of_birth",
          screen_color: "$general_info.screen_color",
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    res.status(200).json({
      success: true,
      message: "My shortlist retrieved successfully",
      data: results,
    });
  }),

  // Get who shortlisted me (users who shortlisted my biodata)
  getWhoShortlistedMe: catchAsync(async (req: Request, res: Response) => {
    const bio_user = req.user?._id;
    if (!bio_user) {
      return res.status(401).send({
        statusCode: 401,
        message: "You are not authorized",
        success: false,
      });
    }

    const user_mongo_id = new mongoose.Types.ObjectId(String(bio_user));

    const results = await Shortlist.aggregate([
      {
        $match: {
          bio_user: user_mongo_id,
          user: { $ne: user_mongo_id },
        },
      },
      {
        $lookup: {
          from: "addresses",
          localField: "user",
          foreignField: "user",
          as: "address",
        },
      },
      { $unwind: { path: "$address", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "generalinfos",
          localField: "user",
          foreignField: "user",
          as: "general_info",
        },
      },
      { $unwind: { path: "$general_info", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user_info",
        },
      },
      { $unwind: { path: "$user_info", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          bio_id: "$user_info.user_id",
          bio_user: "$user",
          permanent_address: "$address.permanent_address",
          date_of_birth: "$general_info.date_of_birth",
          screen_color: "$general_info.screen_color",
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    res.status(200).json({
      success: true,
      message: "Who shortlisted me retrieved successfully",
      data: results,
    });
  }),

  // Check if a bio_user is shortlisted
  checkShortlist: catchAsync(async (req: Request, res: Response) => {
    const user = req.user?._id;
    const bio_user = req.params?.id;
    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }

    const data = await Shortlist.findOne({ user, bio_user });

    res.status(httpStatus.OK).json({
      success: true,
      message: "Shortlist check result",
      data: !!data,
    });
  }),
};
