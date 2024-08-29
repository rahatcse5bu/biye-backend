// src/controllers/GeneralInfoController.ts
import { Request, Response } from "express";
import { sendSuccess } from "../../../shared/SendSuccess";
import httpsStatus from "http-status";
import GeneralInfo from "./general_info.model";
import catchAsync from "../../../shared/catchAsync";
import { UserInfoService } from "../user_info/user_info.services";
import mongoose from "mongoose";
import Favorite from "../favourites/favourites.model";
import UnFavorite from "../unfavorites/unfavorites.model";
import ApiError from "../../middlewares/ApiError";
import ContactPurchase from "../contact_purchase_data/contact_purchase_data.model";

// const getGeneralInfo = catchAsync(async (req: Request, res: Response) => {
//   const {
//     bio_type,
//     marital_status,
//     isFeatured,
//     zilla,
//     limit = 10,
//     page = 1,
//     user_status = "active",
//     division,
//     sortBy = "createdAt", // default sorting field
//     sortOrder = "desc",
//   } = req.query;

//   const andConditions: any = [
//     {
//       "userDetails.user_status": user_status,
//     },
//   ];

//   if (division !== "all") {
//     if (zilla) {
//       if (typeof zilla === "string") {
//         andConditions.push({
//           "address.zilla": { $in: zilla.split(",") },
//         });
//       } else if (Array.isArray(zilla)) {
//         andConditions.push({
//           "address.zilla": { $in: zilla },
//         });
//       }
//     }

//     if (division) {
//       if (typeof division === "string") {
//         andConditions.push({
//           "address.division": { $in: division.split(",") },
//         });
//       } else if (Array.isArray(division)) {
//         andConditions.push({
//           "address.division": { $in: division },
//         });
//       }
//     }
//   }

//   // console.log("division", division);
//   // console.log("zilla", zilla);
//   // console.log("andConditions", andConditions);

//   // Parse limit and page to numbers
//   const limitNumber = Number(limit);
//   const pageNumber = Number(page);

//   // Parse sort parameters
//   const sortField = typeof sortBy === "string" ? sortBy : "createdAt";
//   const sortDirection = sortOrder === "asc" ? 1 : -1;

//   // Parse isFeatured to boolean

//   if (isFeatured) {
//     // console.log("isFeatured~~", isFeaturedBool, typeof isFeatured);
//     const isFeaturedBool = isFeatured === "true";
//     andConditions.push({
//       isFeatured: isFeaturedBool,
//     });
//   }

//   // Construct aggregation pipeline
//   const pipeline: any = [
//     {
//       $lookup: {
//         from: "users", // Collection name for User model
//         localField: "user",
//         foreignField: "_id",
//         as: "userDetails",
//       },
//     },
//     {
//       $unwind: "$userDetails", // Unwind the joined user details
//     },
//     {
//       $lookup: {
//         from: "addresses", // Collection name for User model
//         localField: "user",
//         foreignField: "user",
//         as: "address",
//       },
//     },
//     {
//       $unwind: "$address", // Unwind the joined user details
//     },
//     {
//       $match: {
//         $and: andConditions,
//       },
//     },
//     // Optional match stage for additional filters
//     ...(bio_type || marital_status
//       ? [
//           {
//             $match: {
//               ...(bio_type && { bio_type }),
//               ...(marital_status && { marital_status }),
//             },
//           },
//         ]
//       : []),

//     // Sort stage
//     { $sort: { [sortField]: sortDirection } },

//     // Pagination stages
//     { $skip: limitNumber * (pageNumber - 1) },
//     { $limit: limitNumber },
//     // Optionally project to remove user details from final output if not needed
//     {
//       $project: {
//         _id: 1, // Include _id of GeneralInfo
//         user_id: "$userDetails.user_id", // Include user_id from User schema
//         user: "$userDetails._id",
//         upzilla: "$address.upzilla", // Include user_id from User schema

//         bio_type: 1,
//         date_of_birth: 1,
//         height: 1,
//         gender: 1,
//         weight: 1,
//         blood_group: 1,
//         screen_color: 1,
//         nationality: 1,
//         marital_status: 1,
//         views_count: 1,
//         purchases_count: 1,
//         isFbPosted: 1,
//         isFeatured: 1,
//         dislikes_count: 1,
//         likes_count: 1,
//         zilla: 1,
//       },
//     },
//   ];

//   // Execute the aggregation pipeline
//   const generalInfos = await GeneralInfo.aggregate(pipeline);

//   res.status(200).json({
//     success: true,
//     message: "All General info retrieved successfully",
//     data: generalInfos,
//     page: pageNumber,
//     limit: limitNumber,
//   });
// });

const getGeneralInfo = catchAsync(async (req: Request, res: Response) => {
  const {
    bio_type,
    marital_status,
    isFeatured,
    zilla,
    limit = 10,
    page = 1,
    user_status = "active",
    division,
    sortBy = "createdAt", // default sorting field
    sortOrder = "desc",
  } = req.query;

  const andConditions: any = [
    {
      "userDetails.user_status": user_status,
    },
  ];

  if (division !== "all") {
    if (zilla) {
      if (typeof zilla === "string") {
        andConditions.push({
          "address.zilla": { $in: zilla.split(",") },
        });
      } else if (Array.isArray(zilla)) {
        andConditions.push({
          "address.zilla": { $in: zilla },
        });
      }
    }

    if (division) {
      if (typeof division === "string") {
        andConditions.push({
          "address.division": { $in: division.split(",") },
        });
      } else if (Array.isArray(division)) {
        andConditions.push({
          "address.division": { $in: division },
        });
      }
    }
  }

  // Parse limit and page to numbers
  const limitNumber = Number(limit);
  const pageNumber = Number(page);

  // Parse sort parameters
  const sortField = typeof sortBy === "string" ? sortBy : "createdAt";
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  // Parse isFeatured to boolean
  if (isFeatured) {
    const isFeaturedBool = isFeatured === "true";
    andConditions.push({
      isFeatured: isFeaturedBool,
    });
  }

  // Construct aggregation pipeline for counting total size
  const countPipeline: any = [
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $unwind: "$userDetails",
    },
    {
      $lookup: {
        from: "addresses",
        localField: "user",
        foreignField: "user",
        as: "address",
      },
    },
    {
      $unwind: "$address",
    },
    {
      $match: {
        $and: andConditions,
      },
    },
    ...(bio_type || marital_status
      ? [
          {
            $match: {
              ...(bio_type && { bio_type }),
              ...(marital_status && { marital_status }),
            },
          },
        ]
      : []),
    {
      $count: "totalCount",
    },
  ];

  // Get the total count
  const totalResult = await GeneralInfo.aggregate(countPipeline);
  const totalCount = totalResult.length > 0 ? totalResult[0].totalCount : 0;

  // Construct aggregation pipeline for actual data retrieval
  const dataPipeline: any = [
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $unwind: "$userDetails",
    },
    {
      $lookup: {
        from: "addresses",
        localField: "user",
        foreignField: "user",
        as: "address",
      },
    },
    {
      $unwind: "$address",
    },
    {
      $match: {
        $and: andConditions,
      },
    },
    ...(bio_type || marital_status
      ? [
          {
            $match: {
              ...(bio_type && { bio_type }),
              ...(marital_status && { marital_status }),
            },
          },
        ]
      : []),
    { $sort: { [sortField]: sortDirection } },
    { $skip: limitNumber * (pageNumber - 1) },
    { $limit: limitNumber },
    {
      $project: {
        _id: 1,
        user_id: "$userDetails.user_id",
        user: "$userDetails._id",
        upzilla: "$address.upzilla",
        bio_type: 1,
        date_of_birth: 1,
        height: 1,
        gender: 1,
        weight: 1,
        blood_group: 1,
        screen_color: 1,
        nationality: 1,
        marital_status: 1,
        views_count: 1,
        purchases_count: 1,
        isFbPosted: 1,
        isFeatured: 1,
        dislikes_count: 1,
        likes_count: 1,
        zilla: 1,
      },
    },
  ];

  // Execute the aggregation pipeline for data retrieval
  const generalInfos = await GeneralInfo.aggregate(dataPipeline);

  res.status(200).json({
    success: true,
    message: "All General info retrieved successfully",
    data: generalInfos,
    page: pageNumber,
    limit: limitNumber,
    size: totalCount, // Include the total count in the response
  });
});

const getGeneralInfoByAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const {
      bio_type,
      marital_status,
      isFeatured,
      zilla,
      limit = 10,
      page = 1,
      user_status = "active",
    } = req.query;

    const andConditions: any = [
      {
        "userDetails.user_status": user_status,
      },
    ];

    // Parse limit and page to numbers
    const limitNumber = Number(limit);
    const pageNumber = Number(page);

    // Parse isFeatured to boolean

    if (isFeatured) {
      // console.log("isFeatured~~", isFeaturedBool, typeof isFeatured);
      const isFeaturedBool = isFeatured === "true";
      andConditions.push({
        isFeatured: isFeaturedBool,
      });
    }

    // Construct aggregation pipeline
    const pipeline = [
      {
        $lookup: {
          from: "users", // Collection name for User model
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails", // Unwind the joined user details
      },
      {
        $match: {
          $and: andConditions,
        },
      },
      // Optional match stage for additional filters
      ...(bio_type || marital_status || zilla
        ? [
            {
              $match: {
                ...(bio_type && { bio_type }),
                ...(marital_status && { marital_status }),
                ...(zilla && { zilla }),
              },
            },
          ]
        : []),
      // Pagination stages
      { $skip: limitNumber * (pageNumber - 1) },
      { $limit: limitNumber },
      // Optionally project to remove user details from final output if not needed
      {
        $project: {
          _id: 1, // Include _id of GeneralInfo
          user_id: "$userDetails.user_id", // Include user_id from User schema
          user: "$userDetails._id", // Include user_id from User schema
          upzilla: "$address.upzilla", // Include user_id from User schema
          bio_type: 1,
          date_of_birth: 1,
          height: 1,
          gender: 1,
          weight: 1,
          blood_group: 1,
          screen_color: 1,
          nationality: 1,
          marital_status: 1,
          views_count: 1,
          purchases_count: 1,
          isFbPosted: 1,
          isFeatured: 1,
          dislikes_count: 1,
          likes_count: 1,
          zilla: 1,
        },
      },
    ];

    // Execute the aggregation pipeline
    const generalInfos = await GeneralInfo.aggregate(pipeline);

    res.status(200).json({
      success: true,
      message: "All General info retrieved successfully",
      data: generalInfos,
      page: pageNumber,
      limit: limitNumber,
      size: generalInfos.length,
    });
  }
);

const getFeaturedGeneralInfo = catchAsync(
  async (req: Request, res: Response) => {
    const { bio_type, marital_status, zilla, limit = 10, page = 1 } = req.query;

    // Parse limit and page to numbers
    const limitNumber = Number(limit);
    const pageNumber = Number(page);

    // Construct aggregation pipeline
    const pipeline = [
      {
        $lookup: {
          from: "users", // Collection name for User model
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails", // Unwind the joined user details
      },
      {
        $match: {
          $or: [{ "userDetails.user_status": "active" }],
        },
      },
      // Optional match stage for additional filters
      ...(bio_type || marital_status || zilla
        ? [
            {
              $match: {
                ...(bio_type && { bio_type }),
                ...(marital_status && { marital_status }),
                ...(zilla && { zilla }),
              },
            },
          ]
        : []),
      // Pagination stages
      { $skip: limitNumber * (pageNumber - 1) },
      { $limit: limitNumber },
      // Optionally project to remove user details from final output if not needed
      {
        $project: {
          _id: 1, // Include _id of GeneralInfo
          user_id: "$userDetails.user_id", // Include user_id from User schema
          user: "$userDetails._id", // Include user_id from User schema
          bio_type: 1,
          date_of_birth: 1,
          height: 1,
          gender: 1,
          weight: 1,
          blood_group: 1,
          screen_color: 1,
          nationality: 1,
          marital_status: 1,
          views_count: 1,
          purchases_count: 1,
          isFbPosted: 1,
          isFeatured: 1,
          dislikes_count: 1,
          likes_count: 1,
          zilla: 1,
        },
      },
    ];

    // Execute the aggregation pipeline
    const generalInfos = await GeneralInfo.aggregate(pipeline);

    res.status(200).json({
      success: true,
      message: "All General info retrieved successfully",
      data: generalInfos,
      page: pageNumber,
      limit: limitNumber,
      size: generalInfos.length,
    });
  }
);

const getGeneralInfoByUserId = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.params.id;

    const generalInfo = await GeneralInfo.findOne({ user_id: userId });

    if (!generalInfo) {
      return res.status(404).json({
        message: "General info not found for the specified user_id",
        success: false,
      });
    }

    res.status(200).json({
      message: "General info retrieved successfully",
      success: true,
      data: generalInfo,
    });
  }
);
const getGeneralInfoDashboardByUser = catchAsync(
  async (req: Request, res: Response) => {
    if (!req?.user) {
      throw new ApiError(400, "You are not authorized");
    }
    const user = req.user._id;

    const generalInfo = await GeneralInfo.findOne({ user: user })
      .select("likes_count views_count")
      .lean();
    const favorite = await Favorite.countDocuments({
      user,
    }).lean();
    const unFavorite = await UnFavorite.countDocuments({
      user,
    }).lean();
    const contactPurchase = await ContactPurchase.countDocuments({
      user,
    }).lean();

    if (!generalInfo) {
      return res.status(404).json({
        message: "General info not found",
        success: false,
      });
    }
    const responseData = {
      likes_count: generalInfo.likes_count,
      views_count: generalInfo.views_count,
      favorite_count: favorite,
      unFavorite_count: unFavorite,
      contact_purchase_count: contactPurchase,
    };

    res.status(200).json({
      message: "General info retrieved successfully",
      success: true,
      data: responseData,
    });
  }
);
const getGeneralInfoByToken = catchAsync(
  async (req: Request, res: Response) => {
    // console.log(req.user);
    const generalInfo = await GeneralInfo.findOne({ user: req.user?._id });

    if (!generalInfo) {
      return res.status(404).json({
        message: "General info not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "General info retrieved successfully",
      success: true,
      data: generalInfo,
    });
  }
);

const getSingleGeneralInfo = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;

  const generalInfo = await GeneralInfo.findById(userId);

  if (!generalInfo) {
    return res.status(404).json({
      message: "General info not found",
      success: false,
    });
  }

  res.status(200).json(sendSuccess("General info retrieved", generalInfo, 200));
});

const createGeneralInfo = catchAsync(async (req: Request, res: Response) => {
  const { user_form, ...data } = req.body;

  if (!req.user?._id) {
    return res.status(401).send({
      statusCode: httpsStatus.UNAUTHORIZED,
      message: "You are not authorized",
      success: false,
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    data.user = req.user._id;

    // Insert general_information into the database
    const generalInfo = new GeneralInfo(data);
    await generalInfo.save({ session });

    const user: any = await UserInfoService.getUserInfoByIdWithSession(
      req.user._id,
      { session }
    );

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).send({
        statusCode: httpsStatus.NOT_FOUND,
        message: "User not found",
        success: false,
      });
    }

    // Update the fields edited_timeline_index and last_edited_timeline_index of user_info table
    user.edited_timeline_index = Math.max(
      user.edited_timeline_index,
      user_form
    );
    user.last_edited_timeline_index = user_form;
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "General info created and user_info updated successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error; // You might want to handle the error more gracefully in a real application
  }
});

const updateGeneralInfo = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "You are not authorized",
    });
  }

  // Check if General info for the user with the given ID exists
  const generalInfo = await GeneralInfo.findOne({ user: userId });
  if (!generalInfo) {
    return res.status(404).json({
      success: false,
      message: "General info not found",
    });
  }

  // Update the general info with the new data
  Object.assign(generalInfo, data);
  await generalInfo.save();

  res.status(200).json({
    message: "Update successfully completed",
    success: true,
    data: generalInfo,
  });
});
const updateWatchOfBioData = catchAsync(async (req: Request, res: Response) => {
  const bioId = req.params.id;

  // Check if General info for the user with the given ID exists
  const generalInfo = await GeneralInfo.findById(bioId);
  if (!generalInfo) {
    return res.status(404).json({
      success: false,
      message: "General info not found",
    });
  }

  generalInfo.views_count = generalInfo.views_count + 1;

  await generalInfo.save();

  res.status(200).json({
    message: "Updated watch count",
    success: true,
  });
});

const deleteGeneralInfo = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;

  // Check if general_info for the user with the given ID exists
  const generalInfo = await GeneralInfo.findById(userId);
  if (!generalInfo) {
    return res.status(404).json({
      success: false,
      message: "general_info not found",
    });
  }

  // Delete the general info
  await GeneralInfo.findByIdAndDelete(userId);

  res.status(200).json({
    success: true,
    message: "General info deleted successfully",
  });
});

export const GeneralInfoController = {
  getGeneralInfo,
  getSingleGeneralInfo,
  createGeneralInfo,
  updateGeneralInfo,
  deleteGeneralInfo,
  getGeneralInfoByUserId,
  getGeneralInfoByToken,
  updateWatchOfBioData,
  getGeneralInfoByAdmin,
  getGeneralInfoDashboardByUser,
};
