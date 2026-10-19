import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { UserInfoModel } from "../user_info/user_info.model";
import mongoose from "mongoose";
import { FavoriteService } from "./favourites.services";
import Favorite from "./favourites.model";
import GeneralInfo from "../general_info/general_info.model";
import LikersAccess, { LIKERS_VIEW_POINTS } from "./likers_access.model";
import { NotificationService } from "../notifications/notification.service";

export const FavoriteController = {
  getAllFavorites: catchAsync(async (req: Request, res: Response) => {
    const favorites = await FavoriteService.getAllFavorites();
    res.status(httpStatus.OK).json({
      success: true,
      message: "All favorites retrieved successfully",
      data: favorites,
    });
  }),

  getMyFavouritesList: catchAsync(async (req: Request, res: Response) => {
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
    const results = await Favorite.aggregate([
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
  getFavouritesListByUser: catchAsync(async (req: Request, res: Response) => {
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

    // TODO: paid feature; until unlocked only the count is sent, so the list can't be read from the API for free.
    const unlocked = await LikersAccess.exists({ user: user_mongo_bio_id });
    if (!unlocked) {
      const count = await Favorite.countDocuments({ bio_user: user_mongo_bio_id, user: { $ne: user_mongo_bio_id } });
      return res.status(httpStatus.OK).json({
        success: true,
        locked: true,
        price: LIKERS_VIEW_POINTS,
        count,
        data: [],
      });
    }

    // Perform aggregation to fetch the required data
    const results = await Favorite.aggregate([
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
      locked: false,
      price: LIKERS_VIEW_POINTS,
      count: results.length,
      message: "Favourites retrieved successfully",
      data: results,
    });
  }),

  // TODO: one-time unlock of "who favourited my biodata"; points are taken atomically and only once.
  unlockLikers: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: "You are not authorized" });
    }
    if (await LikersAccess.exists({ user: userId })) {
      const user: any = await UserInfoModel.findById(userId).select("points").lean();
      return res.status(httpStatus.OK).json({ success: true, alreadyUnlocked: true, points_balance: user?.points ?? null });
    }

    const charged: any = await UserInfoModel.findOneAndUpdate(
      { _id: userId, points: { $gte: LIKERS_VIEW_POINTS } },
      { $inc: { points: -LIKERS_VIEW_POINTS } },
      { new: true },
    )
      .select("points")
      .lean();
    if (!charged) {
      const user: any = await UserInfoModel.findById(userId).select("points").lean();
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        insufficient: true,
        price: LIKERS_VIEW_POINTS,
        points_balance: user?.points ?? 0,
        message: `এই তালিকা দেখতে ${LIKERS_VIEW_POINTS} পয়েন্ট প্রয়োজন। আপনার অ্যাকাউন্টে পর্যাপ্ত পয়েন্ট নেই।`,
      });
    }

    try {
      await LikersAccess.create({ user: userId, points_spent: LIKERS_VIEW_POINTS });
    } catch (error: any) {
      // TODO: a parallel request unlocked it first; give these points back.
      const refunded: any = await UserInfoModel.findByIdAndUpdate(
        userId,
        { $inc: { points: LIKERS_VIEW_POINTS } },
        { new: true },
      )
        .select("points")
        .lean();
      if (error?.code === 11000) {
        return res.status(httpStatus.OK).json({ success: true, alreadyUnlocked: true, points_balance: refunded?.points ?? null });
      }
      throw error;
    }

    NotificationService.notify({
      recipient: String(userId),
      audience: "user",
      type: "payment",
      title: "পছন্দকারীদের তালিকা আনলক হয়েছে",
      message: `${LIKERS_VIEW_POINTS} পয়েন্ট খরচ হয়েছে। এখন থেকে কারা আপনার বায়োডাটা পছন্দের তালিকায় রেখেছেন তা দেখতে পারবেন।`,
      link: "/user/account/likes",
    });
    res.status(httpStatus.OK).json({ success: true, alreadyUnlocked: false, points_balance: charged.points });
  }),
  getFavoriteById: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const favorite = await FavoriteService.getFavoriteById(id);
    if (!favorite) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Favorite not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "Favorite retrieved successfully",
        data: favorite,
      });
    }
  }),
  getFavoriteByToken: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const favorite = await FavoriteService.getFavoriteByToken(userId);
    if (!favorite) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Favorite not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "Favorite retrieved successfully",
        data: favorite,
      });
    }
  }),

  createFavorite: catchAsync(async (req: Request, res: Response) => {
    const MAX_RETRIES = 3; // Maximum number of retries for transient errors
    const { bio_user } = req.body;
    const user = req.user?._id;

    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }

    let retries = 0;
    while (retries < MAX_RETRIES) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const existingFavorite = await Favorite.findOne({
          user,
          bio_user,
        }).session(session);

        if (existingFavorite) {
          const response = await Favorite.findOneAndDelete({
            user,
            bio_user,
          }).session(session);
          if (response) {
            const updateUser = await GeneralInfo.findOneAndUpdate(
              { user: bio_user },
              { $inc: { likes_count: -1 } },
              { new: true, session }
            );

            await session.commitTransaction();
            session.endSession();
            return res.json({
              success: true,
              message: "Favorite was successfully deleted.",
            });
          }
        } else {
          const response = await Favorite.create([{ user, bio_user }], {
            session,
          });
          if (response) {
            const updateUser = await GeneralInfo.findOneAndUpdate(
              { user: bio_user },
              { $inc: { likes_count: 1 } },
              { new: true, session }
            );

            await session.commitTransaction();
            session.endSession();
            return res.json({
              success: true,
              message: "Favorite was successfully added.",
            });
          }
        }
      } catch (error: any) {
        await session.abortTransaction();
        session.endSession();

        if (error.code === 112) {
          // Transient error code
          retries++;
          console.warn(`Retrying transaction, attempt ${retries}`);
          await new Promise((resolve) => setTimeout(resolve, 100 * retries)); // Exponential backoff
        } else {
          console.error("Error creating or deleting favorite:", error);
          return res.status(500).json({
            success: false,
            message: "Internal server error",
          });
        }
      }
    }

    // If all retries fail
    return res.status(500).json({
      success: false,
      message: "Failed to create or delete favorite after multiple attempts.",
    });
  }),

  // createFavorite: catchAsync(async (req: Request, res: Response) => {
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
  //     const existingFavorite = await Favorite.findOne({
  //       user,
  //       bio_user,
  //     })
  //       .lean()
  //       .session(session);

  //     if (existingFavorite) {
  //       // If the favorite exists, delete it and decrement likes_count
  //       const response = await Favorite.findOneAndDelete({
  //         user,
  //         bio_user,
  //       })
  //         .lean()
  //         .session(session);
  //       if (response) {
  //         const updateUser = await GeneralInfo.findOne({
  //           user: bio_user,
  //         }).session(session);
  //         if (updateUser) {
  //           updateUser.likes_count = updateUser.likes_count - 1;
  //           await updateUser.save({ session });
  //         }
  //         await session.commitTransaction();
  //         session.endSession();
  //         return res.json({
  //           success: true,
  //           message: "Favorite was successfully deleted.",
  //         });
  //       }
  //     } else {
  //       // If the favorite doesn't exist, create it and increment likes_count
  //       const response = await Favorite.create([{ user, bio_user }], {
  //         session,
  //       });
  //       if (response) {
  //         const updateUser = await GeneralInfo.findOne({
  //           user: bio_user,
  //         }).session(session);
  //         if (updateUser) {
  //           updateUser.likes_count = updateUser.likes_count + 1;
  //           await updateUser.save({ session });
  //         }
  //         await session.commitTransaction();
  //         session.endSession();
  //         return res.json({
  //           success: true,
  //           message: "Favorite was successfully added.",
  //         });
  //       }
  //     }
  //   } catch (error) {
  //     // If any error occurs, abort the transaction
  //     await session.abortTransaction();
  //     session.endSession();
  //     console.error("Error creating or deleting favorite:", error);
  //     return res.status(500).json({
  //       success: false,
  //       message: "Internal server error",
  //     });
  //   }
  // }),

  updateFavorite: catchAsync(async (req: Request, res: Response) => {
    const id = req.user?._id;
    if (!id) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const updatedFields = req.body;
    const updatedFavorite = await FavoriteService.updateFavorite(
      id,
      updatedFields
    );
    if (!updatedFavorite) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Favorite not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "Favorite updated successfully",
        data: updatedFavorite,
      });
    }
  }),

  checkLikes: catchAsync(async (req: Request, res: Response) => {
    const user = req.user?._id;
    const bio_user = req.params?.id;
    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    let data = await Favorite.findOne({
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
  deleteFavorite: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    await FavoriteService.deleteFavorite(id);
    res.status(httpStatus.OK).json({
      success: true,
      message: "Favorite deleted successfully",
    });
  }),
};
