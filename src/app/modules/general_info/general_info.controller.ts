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
    sortBy = "createdAt",
    sortOrder = "desc",
    // New filter parameters
    gender,
    minAge,
    maxAge,
    minHeight,
    maxHeight,
    complexion, // screen_color
    education_medium,
    deeni_edu,
    occupation,
    fiqh,
    economic_status,
    categories,
    permanent_address,
    current_upzilla,
    upazila,
    current_division,
    current_zilla,
    // Religion filters
    religion,
    religious_type,
  } = req.query;

  const andConditions: any = [
    {
      "userDetails.user_status": user_status,
    },
  ];

  // Gender filter
  if (gender) {
    andConditions.push({ gender });
  }

  // Religion filter
  if (religion) {
    andConditions.push({ religion });
  }

  // Religious type filter
  if (religious_type) {
    andConditions.push({ religious_type });
  }

  // Age filter (calculated from date_of_birth)
  if (minAge || maxAge) {
    const ageConditions: any = {};
    if (maxAge) {
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - Number(maxAge));
      ageConditions.$gte = minDate;
    }
    if (minAge) {
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() - Number(minAge));
      ageConditions.$lte = maxDate;
    }
    if (Object.keys(ageConditions).length > 0) {
      andConditions.push({ date_of_birth: ageConditions });
    }
  }

  // Height filter
  if (minHeight || maxHeight) {
    const heightConditions: any = {};
    if (minHeight) heightConditions.$gte = Number(minHeight);
    if (maxHeight) heightConditions.$lte = Number(maxHeight);
    if (Object.keys(heightConditions).length > 0) {
      andConditions.push({ height: heightConditions });
    }
  }

  // Complexion filter (screen_color)
  if (complexion) {
    if (typeof complexion === "string") {
      andConditions.push({
        screen_color: { $in: complexion.split(",") },
      });
    } else if (Array.isArray(complexion)) {
      andConditions.push({
        screen_color: { $in: complexion },
      });
    }
  }

  // Permanent Address Filters: Division, Zilla, Upazila
  // Handle division filter (skip if "all")
  if (division && division !== "all") {
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

  // Handle zilla (district) filter - independent of division
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

  // Handle upazila filter
  if (upazila) {
    if (typeof upazila === "string") {
      andConditions.push({
        "address.upzilla": { $in: upazila.split(",") },
      });
    } else if (Array.isArray(upazila)) {
      andConditions.push({
        "address.upzilla": { $in: upazila },
      });
    }
  }

  // Current/Present Address Filters
  // Handle current division filter
  if (current_division && current_division !== "all") {
    if (typeof current_division === "string") {
      andConditions.push({
        "present_address.division": { $in: current_division.split(",") },
      });
    } else if (Array.isArray(current_division)) {
      andConditions.push({
        "present_address.division": { $in: current_division },
      });
    }
  }

  // Handle current zilla filter
  if (current_zilla) {
    if (typeof current_zilla === "string") {
      andConditions.push({
        "present_address.zilla": { $in: current_zilla.split(",") },
      });
    } else if (Array.isArray(current_zilla)) {
      andConditions.push({
        "present_address.zilla": { $in: current_zilla },
      });
    }
  }

  // Handle current upzilla filter
  if (current_upzilla) {
    if (typeof current_upzilla === "string") {
      andConditions.push({
        "present_address.upzilla": { $in: current_upzilla.split(",") },
      });
    } else if (Array.isArray(current_upzilla)) {
      andConditions.push({
        "present_address.upzilla": { $in: current_upzilla },
      });
    }
  }

  // Permanent address filter (searching in address fields) - for text search
  if (permanent_address) {
    andConditions.push({
      $or: [
        { "address.zilla": { $regex: permanent_address, $options: "i" } },
        { "address.upzilla": { $regex: permanent_address, $options: "i" } },
        { "address.post_office": { $regex: permanent_address, $options: "i" } },
      ],
    });
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

  // Additional filter conditions for joined collections
  const additionalMatches: any = {};

  // Education medium filter
  if (education_medium) {
    if (typeof education_medium === "string") {
      additionalMatches["education.education_medium"] = { $in: education_medium.split(",") };
    } else if (Array.isArray(education_medium)) {
      additionalMatches["education.education_medium"] = { $in: education_medium };
    }
  }

  // Deeni education filter
  if (deeni_edu) {
    const deeniEduArray = typeof deeni_edu === "string" ? deeni_edu.split(",") : deeni_edu;
    additionalMatches["education.deeni_edu"] = { $in: deeniEduArray };
  }

  // Occupation filter
  if (occupation) {
    const occupationArray = typeof occupation === "string" ? occupation.split(",") : occupation;
    additionalMatches["occupation.occupation"] = { $in: occupationArray };
  }

  // Fiqh filter
  if (fiqh) {
    if (typeof fiqh === "string") {
      additionalMatches["personalInfo.fiqh"] = { $in: fiqh.split(",") };
    } else if (Array.isArray(fiqh)) {
      additionalMatches["personalInfo.fiqh"] = { $in: fiqh };
    }
  }

  // Economic status filter
  if (economic_status) {
    if (typeof economic_status === "string") {
      additionalMatches["familyStatus.financial_situation"] = { $in: economic_status.split(",") };
    } else if (Array.isArray(economic_status)) {
      additionalMatches["familyStatus.financial_situation"] = { $in: economic_status };
    }
  }

  // Categories filter
  if (categories) {
    const categoriesArray = typeof categories === "string" ? categories.split(",") : categories;
    additionalMatches["personalInfo.my_categories"] = { $in: categoriesArray };
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
      $lookup: {
        from: "educationalqualifications",
        localField: "user",
        foreignField: "user",
        as: "education",
      },
    },
    {
      $unwind: { path: "$education", preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: "occupations",
        localField: "user",
        foreignField: "user",
        as: "occupation",
      },
    },
    {
      $unwind: { path: "$occupation", preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: "personalinfos",
        localField: "user",
        foreignField: "user",
        as: "personalInfo",
      },
    },
    {
      $unwind: { path: "$personalInfo", preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: "familystatuses",
        localField: "user",
        foreignField: "user",
        as: "familyStatus",
      },
    },
    {
      $unwind: { path: "$familyStatus", preserveNullAndEmptyArrays: true },
    },
    {
      $match: {
        $and: andConditions,
      },
    },
    ...(bio_type || marital_status || Object.keys(additionalMatches).length > 0
      ? [
          {
            $match: {
              ...(bio_type && { bio_type }),
              ...(marital_status && { marital_status }),
              ...additionalMatches,
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
      $lookup: {
        from: "educationalqualifications",
        localField: "user",
        foreignField: "user",
        as: "education",
      },
    },
    {
      $unwind: { path: "$education", preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: "occupations",
        localField: "user",
        foreignField: "user",
        as: "occupation",
      },
    },
    {
      $unwind: { path: "$occupation", preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: "personalinfos",
        localField: "user",
        foreignField: "user",
        as: "personalInfo",
      },
    },
    {
      $unwind: { path: "$personalInfo", preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: "familystatuses",
        localField: "user",
        foreignField: "user",
        as: "familyStatus",
      },
    },
    {
      $unwind: { path: "$familyStatus", preserveNullAndEmptyArrays: true },
    },
    {
      $match: {
        $and: andConditions,
      },
    },
    ...(bio_type || marital_status || Object.keys(additionalMatches).length > 0
      ? [
          {
            $match: {
              ...(bio_type && { bio_type }),
              ...(marital_status && { marital_status }),
              ...additionalMatches,
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
        religion: 1,
        religious_type: 1,
        photos: 1,
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
          religion: 1,
          religious_type: 1,
          photos: 1,
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
          religion: 1,
          religious_type: 1,
          photos: 1,
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
