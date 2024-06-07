import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { UserInfoModel } from "../user_info/user_info.model";
import mongoose from "mongoose";
import { FavoriteService } from "./favourites.services";
import Favorite from "./favourites.model";
import GeneralInfo from "../general_info/general_info.model";

export const FavoriteController = {
  getAllFavorites: catchAsync(async (req: Request, res: Response) => {
    const favorites = await FavoriteService.getAllFavorites();
    res.status(httpStatus.OK).json({
      success: true,
      message: "All favorites retrieved successfully",
      data: favorites,
    });
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
