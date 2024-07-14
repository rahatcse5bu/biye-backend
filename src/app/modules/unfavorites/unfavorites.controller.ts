import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { UserInfoModel } from "../user_info/user_info.model";
import mongoose from "mongoose";

import GeneralInfo from "../general_info/general_info.model";
import { UnFavoriteService } from "./unfavorites.service";
import UnFavorite from "./unfavorites.model";

export const UnFavoriteController = {
  getAllUnFavorites: catchAsync(async (req: Request, res: Response) => {
    const unUnFavorites = await UnFavoriteService.getAllUnFavorites();
    res.status(httpStatus.OK).json({
      success: true,
      message: "All unUnFavorites retrieved successfully",
      data: unUnFavorites,
    });
  }),

  getMyUnFavouritesList: catchAsync(async (req: Request, res: Response) => {
    const user = req.user?._id;
    if (!user) {
      return res.status(401).send({
        statusCode: 401,
        message: "You are not authorized",
        success: false,
      });
    }

    const user_mongo_id = new mongoose.Types.ObjectId(String(user));

    // Perform aggregation to fetch the required data
    const results = await UnFavorite.aggregate([
      { $match: { user: user_mongo_id, bio_user: { $ne: user_mongo_id } } },
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
          from: "generalinfos",
          localField: "bio_user",
          foreignField: "user",
          as: "general_info",
        },
      },
      { $unwind: "$general_info" },
      {
        $project: {
          bio_id: "$user.user_id",
          bio_user: "$address.user",
          permanent_address: "$address.permanent_address",
          date_of_birth: "$general_info.date_of_birth",
          screen_color: "$general_info.screen_color",
        },
      },
    ]);

    res.status(201).json({
      success: true,
      message: "Favourites retrieved successfully",
      data: results,
    });
  }),
  getUnFavouritesListByUser: catchAsync(async (req: Request, res: Response) => {
    const bio_user = req.user?._id;
    // console.log("bio_user~~", bio_user);
    if (!bio_user) {
      return res.status(401).send({
        statusCode: 401,
        message: "You are not authorized",
        success: false,
      });
    }

    const user_mongo_bio_id = new mongoose.Types.ObjectId(String(bio_user));

    // Perform aggregation to fetch the required data
    const results = await UnFavorite.aggregate([
      {
        $match: {
          bio_user: user_mongo_bio_id,
          user: { $ne: user_mongo_bio_id },
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
      { $unwind: "$address" },

      {
        $lookup: {
          from: "generalinfos",
          localField: "user",
          foreignField: "user",
          as: "general_info",
        },
      },
      { $unwind: "$general_info" },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          bio_id: "$user.user_id",
          bio_user: "$address.user",
          permanent_address: "$address.permanent_address",
          date_of_birth: "$general_info.date_of_birth",
          screen_color: "$general_info.screen_color",
        },
      },
    ]);

    res.status(201).json({
      success: true,
      message: "Favourites retrieved successfully",
      data: results,
    });
  }),

  getUnFavoriteById: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const unUnFavorite = await UnFavoriteService.getUnFavoriteById(id);
    if (!unUnFavorite) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "UnFavorite not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "UnFavorite retrieved successfully",
        data: unUnFavorite,
      });
    }
  }),
  getUnFavoriteByToken: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const unUnFavorite = await UnFavoriteService.getUnFavoriteByToken(userId);
    if (!unUnFavorite) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "UnFavorite not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "UnFavorite retrieved successfully",
        data: unUnFavorite,
      });
    }
  }),

  // createUnFavorite: catchAsync(async (req: Request, res: Response) => {
  //   const { bio_user } = req.body;
  //   const user = req.user?._id;

  //   if (!user) {
  //     return res.status(httpStatus.UNAUTHORIZED).json({
  //       statusCode: httpStatus.UNAUTHORIZED,
  //       message: "You are not authorized",
  //       success: false,
  //     });
  //   }
  //   // Start a session
  //   const session = await mongoose.startSession();
  //   session.startTransaction();

  //   try {
  //     const existingUnFavorite = await UnFavorite.findOne({
  //       user,
  //       bio_user,
  //     }).session(session);

  //     if (existingUnFavorite) {
  //       // If the unUnFavorite exists, delete it and decrement likes_count
  //       await UnFavorite.findOneAndDelete({
  //         user,
  //         bio_user,
  //       }).session(session);

  //       return res.json({
  //         success: true,
  //         message: "UnFavorite was successfully deleted.",
  //       });
  //     } else {
  //       // If the unUnFavorite doesn't exist, create it and increment likes_count
  //       await UnFavorite.create([{ user, bio_user }], {
  //         session,
  //       });

  //       return res.json({
  //         success: true,
  //         message: "UnFavorite was successfully added.",
  //       });
  //     }
  //   } catch (error) {
  //     // If any error occurs, abort the transaction
  //     await session.abortTransaction();
  //     session.endSession();
  //     console.error("Error creating or deleting unUnFavorite:", error);
  //     return res.status(500).json({
  //       success: false,
  //       message: "Internal server error",
  //     });
  //   }
  // }),
  createUnFavorite: catchAsync(async (req, res) => {
    const { bio_user } = req.body;
    const user = req.user?._id;

    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const existingUnFavorite = await UnFavorite.findOne({
        user,
        bio_user,
      }).session(session);

      if (existingUnFavorite) {
        await UnFavorite.findOneAndDelete({ user, bio_user }).session(session);
        await session.commitTransaction();
        return res.json({
          success: true,
          message: "UnFavorite was successfully deleted.",
        });
      } else {
        await UnFavorite.create([{ user, bio_user }], { session });
        await session.commitTransaction();
        return res.json({
          success: true,
          message: "UnFavorite was successfully added.",
        });
      }
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Error creating or deleting unUnFavorite:", error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    } finally {
      session.endSession();
    }
  }),
  updateUnFavorite: catchAsync(async (req: Request, res: Response) => {
    const id = req.user?._id;
    if (!id) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const updatedFields = req.body;
    const updatedUnFavorite = await UnFavoriteService.updateUnFavorite(
      id,
      updatedFields
    );
    if (!updatedUnFavorite) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "UnFavorite not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "UnFavorite updated successfully",
        data: updatedUnFavorite,
      });
    }
  }),

  checkDisLikes: catchAsync(async (req: Request, res: Response) => {
    const user = req.user?._id;
    const bio_user = req.params?.id;
    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    let data = await UnFavorite.findOne({
      user,
      bio_user,
    });

    let result = false;
    if (data) {
      result = true;
    }

    res.status(httpStatus.OK).json({
      success: true,
      message: "Retrieve checks",
      data: result,
    });
  }),
  deleteUnFavorite: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    await UnFavoriteService.deleteUnFavorite(id);
    res.status(httpStatus.OK).json({
      success: true,
      message: "UnFavorite deleted successfully",
    });
  }),
};
