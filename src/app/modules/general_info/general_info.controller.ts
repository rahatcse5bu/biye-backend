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
    // English alias filters (for API/agent use — avoids Bengali in query params)
    bio_gender,   // 'male' | 'female'  →  maps to bio_type Bengali value
    marital_status_en, // 'unmarried'|'married'|'divorced'|'widow'|'widower'
    // Expected partner filters
    exp_zilla,
    exp_marital_status,
    exp_occupation,
    exp_economical_condition,
    exp_educational_qualifications,
  } = req.query;

  const toStringArray = (value: unknown): string[] => {
    const values = Array.isArray(value) ? value : [value];
    return values
      .flatMap((item) => (typeof item === "string" ? item.split(",") : []))
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const firstQueryValue = (value: unknown): string | undefined =>
    toStringArray(value)[0];

  // Resolve bio_type from English aliases. Both common Unicode spellings are
  // accepted because legacy records contain both বায়োডাটা and বায়োডাটা.
  const BIO_GENDER_MAP: Record<string, string[]> = {
    male: ["পাত্রের বায়োডাটা", "পাত্রের বায়োডাটা"],
    groom: ["পাত্রের বায়োডাটা", "পাত্রের বায়োডাটা"],
    female: ["পাত্রীর বায়োডাটা", "পাত্রীর বায়োডাটা"],
    bride: ["পাত্রীর বায়োডাটা", "পাত্রীর বায়োডাটা"],
  };
  const bioGenderAlias = firstQueryValue(bio_gender)?.toLowerCase();
  const resolvedBioTypes = bioGenderAlias && BIO_GENDER_MAP[bioGenderAlias]
    ? BIO_GENDER_MAP[bioGenderAlias]
    : toStringArray(bio_type);

  // Resolve marital_status from English alias if provided
  const MARITAL_EN_MAP: Record<string, string> = {
    unmarried: "অবিবাহিত",
    single: "অবিবাহিত",
    married: "বিবাহিত",
    divorced: "ডিভোর্সড",
    widow: "বিধবা",
    widowed: "বিধবা",
    widower: "বিপত্নীক",
  };
  const maritalStatusAlias = firstQueryValue(marital_status_en)?.toLowerCase();
  const resolvedMaritalStatuses = maritalStatusAlias && MARITAL_EN_MAP[maritalStatusAlias]
    ? [MARITAL_EN_MAP[maritalStatusAlias]]
    : toStringArray(marital_status);

  // These expressions define the canonical values returned by the public API.
  // They are installed before filtering in both the count and data pipelines.
  const canonicalPublicFields = {
    bio_type: { $ifNull: ["$approved_data.bio_type", "$bio_type"] },
    marital_status: { $ifNull: ["$approved_data.marital_status", "$marital_status"] },
    gender: { $ifNull: ["$approved_data.gender", "$gender"] },
    date_of_birth: {
      $convert: {
        input: { $ifNull: ["$approved_data.date_of_birth", "$date_of_birth"] },
        to: "date",
        onError: null,
        onNull: null,
      },
    },
    height: { $ifNull: ["$approved_data.height", "$height"] },
    screen_color: { $ifNull: ["$approved_data.screen_color", "$screen_color"] },
  };

  const andConditions: any = [
    {
      "userDetails.user_status": user_status,
    },
  ];

  // Gender filter (against the approved-first canonical public value)
  const genderValues = toStringArray(gender);
  if (genderValues.length > 0) {
    andConditions.push({ gender: { $in: genderValues } });
  }

  // Filter by the same approved-first values that are returned publicly.
  // Pending top-level edits must not place a biodata in a different religion
  // filter before an admin approves those changes.
  const religionValue = firstQueryValue(religion);
  if (religionValue) {
    andConditions.push({
      $expr: {
        $eq: [
          {
            $ifNull: [
              "$approved_data.religion",
              { $ifNull: ["$religion", "islam"] },
            ],
          },
          religionValue,
        ],
      },
    });
  }

  const religiousTypeValue = firstQueryValue(religious_type);
  if (religiousTypeValue) {
    andConditions.push({
      $expr: {
        $eq: [
          {
            $ifNull: [
              "$approved_data.religious_type",
              "$religious_type",
            ],
          },
          religiousTypeValue,
        ],
      },
    });
  }

  const parseFiniteNumber = (value: unknown): number | undefined => {
    const rawValue = firstQueryValue(value);
    if (rawValue === undefined) return undefined;
    const parsedValue = Number(rawValue);
    return Number.isFinite(parsedValue) ? parsedValue : undefined;
  };

  const parseAge = (value: unknown): number | undefined => {
    const parsedValue = parseFiniteNumber(value);
    return parsedValue !== undefined && parsedValue >= 0
      ? Math.floor(parsedValue)
      : undefined;
  };

  // Return the same calendar day N years ago, clamping leap day to the final
  // day of February when the target year is not a leap year.
  const calendarDateYearsAgo = (date: Date, years: number): Date => {
    const targetYear = date.getFullYear() - years;
    const targetMonth = date.getMonth();
    const targetDay = date.getDate();
    const shiftedDate = new Date(date);
    shiftedDate.setDate(1);
    shiftedDate.setFullYear(targetYear);
    shiftedDate.setMonth(targetMonth);
    const finalDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    shiftedDate.setDate(Math.min(targetDay, finalDayOfTargetMonth));
    return shiftedDate;
  };

  // Age filter against the approved-first canonical date_of_birth. The oldest
  // accepted maxAge DOB is the day after the (maxAge + 1) anniversary, so
  // everyone who is exactly maxAge today remains included.
  const minAgeNumber = parseAge(minAge);
  const maxAgeNumber = parseAge(maxAge);
  if (minAgeNumber !== undefined || maxAgeNumber !== undefined) {
    const ageConditions: any = {};
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (maxAgeNumber !== undefined) {
      const oldestIncludedBirthDate = calendarDateYearsAgo(
        startOfToday,
        maxAgeNumber + 1
      );
      oldestIncludedBirthDate.setDate(oldestIncludedBirthDate.getDate() + 1);
      ageConditions.$gte = oldestIncludedBirthDate;
    }
    if (minAgeNumber !== undefined) {
      const youngestIncludedBirthDate = calendarDateYearsAgo(
        startOfToday,
        minAgeNumber
      );
      youngestIncludedBirthDate.setHours(23, 59, 59, 999);
      ageConditions.$lte = youngestIncludedBirthDate;
    }
    andConditions.push({ date_of_birth: ageConditions });
  }

  // Height filter against the approved-first canonical public value
  const minHeightNumber = parseFiniteNumber(minHeight);
  const maxHeightNumber = parseFiniteNumber(maxHeight);
  if (minHeightNumber !== undefined || maxHeightNumber !== undefined) {
    const heightConditions: any = {};
    if (minHeightNumber !== undefined) heightConditions.$gte = minHeightNumber;
    if (maxHeightNumber !== undefined) heightConditions.$lte = maxHeightNumber;
    andConditions.push({ height: heightConditions });
  }

  // Complexion filter against the approved-first canonical screen_color
  const complexionValues = toStringArray(complexion);
  if (complexionValues.length > 0) {
    andConditions.push({ screen_color: { $in: complexionValues } });
  }

  // Permanent Address Filters: Division, Zilla, Upazila
  const divisionValues = toStringArray(division);
  if (
    divisionValues.length > 0 &&
    !divisionValues.some((value) => value.toLowerCase() === "all")
  ) {
    andConditions.push({ "address.division": { $in: divisionValues } });
  }

  const zillaValues = toStringArray(zilla);
  if (zillaValues.length > 0) {
    andConditions.push({ "address.zilla": { $in: zillaValues } });
  }

  const upazilaValues = toStringArray(upazila);
  if (upazilaValues.length > 0) {
    andConditions.push({ "address.upzilla": { $in: upazilaValues } });
  }

  // Current/Present Address Filters
  const currentDivisionValues = toStringArray(current_division);
  if (
    currentDivisionValues.length > 0 &&
    !currentDivisionValues.some((value) => value.toLowerCase() === "all")
  ) {
    andConditions.push({
      "address.present_division": { $in: currentDivisionValues },
    });
  }

  const currentZillaValues = toStringArray(current_zilla);
  if (currentZillaValues.length > 0) {
    andConditions.push({
      "address.present_zilla": { $in: currentZillaValues },
    });
  }

  const currentUpzillaValues = toStringArray(current_upzilla);
  if (currentUpzillaValues.length > 0) {
    andConditions.push({
      "address.present_upzilla": { $in: currentUpzillaValues },
    });
  }

  // Permanent address text search. Treat input as literal text so regex control
  // characters cannot alter the query or trigger pathological expressions.
  const permanentAddressValue = firstQueryValue(permanent_address)?.trim();
  if (permanentAddressValue) {
    const escapedPermanentAddress = permanentAddressValue.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    const addressSearch = { $regex: escapedPermanentAddress, $options: "i" };
    andConditions.push({
      $or: [
        { "address.permanent_address": addressSearch },
        { "address.permanent_area": addressSearch },
        { "address.zilla": addressSearch },
        { "address.upzilla": addressSearch },
        { "address.division": addressSearch },
        { "address.city": addressSearch },
      ],
    });
  }

  const parseInteger = (value: unknown, fallback: number): number => {
    const parsedValue = parseFiniteNumber(value);
    return parsedValue === undefined ? fallback : Math.trunc(parsedValue);
  };

  // Clamp pagination to valid, bounded integer values.
  const pageNumber = Math.max(1, parseInteger(page, 1));
  const limitNumber = Math.min(100, Math.max(1, parseInteger(limit, 10)));

  // Only permit fields that exist at sort time and are useful in the public
  // response. Always include _id as a deterministic tie-breaker.
  const allowedSortFields = new Set([
    "_id",
    "createdAt",
    "bio_type",
    "marital_status",
    "gender",
    "date_of_birth",
    "height",
    "screen_color",
    "views_count",
    "purchases_count",
    "likes_count",
    "dislikes_count",
    "isFeatured",
  ]);
  const requestedSortField = firstQueryValue(sortBy);
  const sortField = requestedSortField && allowedSortFields.has(requestedSortField)
    ? requestedSortField
    : "createdAt";
  const sortDirection = firstQueryValue(sortOrder)?.toLowerCase() === "asc" ? 1 : -1;
  const sortSpec: Record<string, 1 | -1> = { [sortField]: sortDirection };
  if (sortField !== "_id") {
    sortSpec._id = sortDirection;
  }

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
  const educationMediumValues = toStringArray(education_medium);
  if (educationMediumValues.length > 0) {
    additionalMatches["education.education_medium"] = {
      $in: educationMediumValues,
    };
  }

  // Deeni education filter
  const deeniEducationValues = toStringArray(deeni_edu);
  if (deeniEducationValues.length > 0) {
    additionalMatches["education.deeni_edu"] = {
      $in: deeniEducationValues,
    };
  }

  // Occupation filter
  const occupationValues = toStringArray(occupation);
  if (occupationValues.length > 0) {
    additionalMatches["occupation.occupation"] = { $in: occupationValues };
  }

  // Fiqh filter
  const fiqhValues = toStringArray(fiqh);
  if (fiqhValues.length > 0) {
    additionalMatches["personalInfo.fiqh"] = { $in: fiqhValues };
  }

  // Economic status filter
  const economicStatusValues = toStringArray(economic_status);
  if (economicStatusValues.length > 0) {
    additionalMatches["familyStatus.eco_condition_type"] = {
      $in: economicStatusValues,
    };
  }

  // Categories filter
  const categoryValues = toStringArray(categories);
  if (categoryValues.length > 0) {
    additionalMatches["personalInfo.my_categories"] = {
      $in: categoryValues,
    };
  }

  // Expected partner filters (filter by what the biodata owner expects in their partner)
  const expectedPartnerMatches: any = {};
  const expectedZillaValues = toStringArray(exp_zilla);
  if (expectedZillaValues.length > 0) {
    expectedPartnerMatches["expectedPartner.zilla"] = {
      $in: expectedZillaValues,
    };
  }

  const expectedMaritalStatusValues = toStringArray(exp_marital_status);
  if (expectedMaritalStatusValues.length > 0) {
    expectedPartnerMatches["expectedPartner.marital_status"] = {
      $in: expectedMaritalStatusValues,
    };
  }

  const expectedOccupationValues = toStringArray(exp_occupation);
  if (expectedOccupationValues.length > 0) {
    expectedPartnerMatches["expectedPartner.occupation"] = {
      $in: expectedOccupationValues,
    };
  }

  const expectedEconomicConditionValues = toStringArray(
    exp_economical_condition
  );
  if (expectedEconomicConditionValues.length > 0) {
    expectedPartnerMatches["expectedPartner.economical_condition"] = {
      $in: expectedEconomicConditionValues,
    };
  }

  const expectedEducationValues = toStringArray(
    exp_educational_qualifications
  );
  if (expectedEducationValues.length > 0) {
    expectedPartnerMatches["expectedPartner.educational_qualifications"] = {
      $in: expectedEducationValues,
    };
  }

  const publicValueMatches = {
    ...(resolvedBioTypes.length > 0 && {
      bio_type: { $in: resolvedBioTypes },
    }),
    ...(resolvedMaritalStatuses.length > 0 && {
      marital_status: { $in: resolvedMaritalStatuses },
    }),
    ...additionalMatches,
    ...expectedPartnerMatches,
  };

  // Count and data retrieval share these exact stages to prevent filter drift.
  // Canonical public fields are set before every match that references them.
  const publicFilterStages: any[] = [
    {
      $lookup: { from: "users", localField: "user", foreignField: "_id", as: "userDetails" },
    },
    { $addFields: { userDetails: { $first: "$userDetails" } } },
    { $match: { userDetails: { $ne: null } } },
    {
      $lookup: { from: "addresses", localField: "user", foreignField: "user", as: "address" },
    },
    { $addFields: { address: { $first: "$address" } } },
    {
      $lookup: { from: "educationalqualifications", localField: "user", foreignField: "user", as: "education" },
    },
    { $addFields: { education: { $first: "$education" } } },
    {
      $lookup: { from: "occupations", localField: "user", foreignField: "user", as: "occupation" },
    },
    { $addFields: { occupation: { $first: "$occupation" } } },
    {
      $lookup: { from: "personalinfos", localField: "user", foreignField: "user", as: "personalInfo" },
    },
    { $addFields: { personalInfo: { $first: "$personalInfo" } } },
    {
      $lookup: { from: "familystatuses", localField: "user", foreignField: "user", as: "familyStatus" },
    },
    { $addFields: { familyStatus: { $first: "$familyStatus" } } },
    {
      $lookup: { from: "expectedpartners", localField: "user", foreignField: "user", as: "expectedPartner" },
    },
    { $addFields: { expectedPartner: { $first: "$expectedPartner" } } },
    { $set: canonicalPublicFields },
    {
      $match: {
        $and: andConditions,
      },
    },
    ...(Object.keys(publicValueMatches).length > 0
      ? [{ $match: publicValueMatches }]
      : []),
  ];

  const countPipeline: any[] = [
    ...publicFilterStages,
    { $count: "totalCount" },
  ];

  // Get the total count
  const totalResult = await GeneralInfo.aggregate(countPipeline);
  const totalCount = totalResult.length > 0 ? totalResult[0].totalCount : 0;

  const dataPipeline: any[] = [
    ...publicFilterStages,
    { $sort: sortSpec },
    { $skip: limitNumber * (pageNumber - 1) },
    { $limit: limitNumber },
    {
      $project: {
        _id: 1,
        user_id: "$userDetails.user_id",
        user: "$userDetails._id",
        upzilla: "$address.upzilla",
        zilla: "$address.zilla",
        division: "$address.division",
        present_upzilla: "$address.present_upzilla",
        present_zilla: "$address.present_zilla",
        present_division: "$address.present_division",
        bio_type: 1,
        date_of_birth: 1,
        height: 1,
        gender: 1,
        weight: { $ifNull: ["$approved_data.weight", "$weight"] },
        blood_group: { $ifNull: ["$approved_data.blood_group", "$blood_group"] },
        screen_color: 1,
        nationality: { $ifNull: ["$approved_data.nationality", "$nationality"] },
        marital_status: 1,
        religion: { $ifNull: ["$approved_data.religion", { $ifNull: ["$religion", "islam"] }] },
        religious_type: { $ifNull: ["$approved_data.religious_type", "$religious_type"] },
        photos: { $ifNull: ["$approved_data.photos", "$photos"] },
        views_count: 1,
        purchases_count: 1,
        isFbPosted: 1,
        isFeatured: 1,
        dislikes_count: 1,
        likes_count: 1,
        createdAt: 1,
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
      // Admin view: show all data + versioning fields for review
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
          biodata_status: 1,
          version: 1,
          approved_data: 1,
          pending_changes: 1,
          admin_note: 1,
          last_approved_at: 1,
          last_approved_by: 1,
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
      // Featured view: serve approved_data if available
      {
        $project: {
          _id: 1,
          user_id: "$userDetails.user_id",
          user: "$userDetails._id",
          bio_type: { $ifNull: ["$approved_data.bio_type", "$bio_type"] },
          date_of_birth: { $ifNull: ["$approved_data.date_of_birth", "$date_of_birth"] },
          height: { $ifNull: ["$approved_data.height", "$height"] },
          gender: { $ifNull: ["$approved_data.gender", "$gender"] },
          weight: { $ifNull: ["$approved_data.weight", "$weight"] },
          blood_group: { $ifNull: ["$approved_data.blood_group", "$blood_group"] },
          screen_color: { $ifNull: ["$approved_data.screen_color", "$screen_color"] },
          nationality: { $ifNull: ["$approved_data.nationality", "$nationality"] },
          marital_status: { $ifNull: ["$approved_data.marital_status", "$marital_status"] },
          religion: { $ifNull: ["$approved_data.religion", "$religion"] },
          religious_type: { $ifNull: ["$approved_data.religious_type", "$religious_type"] },
          photos: { $ifNull: ["$approved_data.photos", "$photos"] },
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

    // Public view: serve approved_data snapshot if available
    let publicData = generalInfo.toObject();
    if (publicData.approved_data) {
      const { approved_data, pending_changes, admin_note, ...meta } = publicData;
      publicData = {
        ...meta,
        ...approved_data,
        photos: approved_data.photos ?? meta.photos,
      };
    }

    res.status(200).json({
      message: "General info retrieved successfully",
      success: true,
      data: publicData,
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

    // Merge pending_changes over top-level fields so the user sees their own latest edits
    let responseData: any = generalInfo.toObject();
    if (responseData.pending_changes && typeof responseData.pending_changes === 'object') {
      responseData = { ...responseData, ...responseData.pending_changes };
    }
    // Ensure religion defaults to 'islam' if not set
    if (!responseData.religion) {
      responseData.religion = 'islam';
    }

    res.status(200).json({
      message: "General info retrieved successfully",
      success: true,
      data: responseData,
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

  // Admin view: merge pending_changes so admin sees the latest user edits
  let responseData: any = generalInfo.toObject();
  if (responseData.pending_changes && typeof responseData.pending_changes === 'object') {
    responseData = { ...responseData, ...responseData.pending_changes };
  }
  // Ensure religion defaults to 'islam' if not set
  if (!responseData.religion) {
    responseData.religion = 'islam';
  }

  res.status(200).json(sendSuccess("General info retrieved", responseData, 200));
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

    const approvedData = { ...data };
    data.approved_data = approvedData;
    data.pending_changes = null;
    data.biodata_status = "approved";
    data.last_approved_at = new Date();

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
  let generalInfo = await GeneralInfo.findOne({ user: userId });
  if (!generalInfo) {
    return res.status(404).json({
      success: false,
      message: "General info not found",
    });
  }

  const metaFields = [
    "_id",
    "__v",
    "user",
    "approved_data",
    "pending_changes",
    "biodata_status",
    "version",
    "admin_note",
    "last_approved_at",
    "last_approved_by",
  ];
  const approvedChanges: Record<string, unknown> = {};

  Object.keys(data).forEach((key: string) => {
    if (!metaFields.includes(key)) {
      (generalInfo as any)[key] = data[key];
      approvedChanges[key] = data[key];
    }
  });

  generalInfo.approved_data = {
    ...(generalInfo.approved_data || {}),
    ...approvedChanges,
  };
  generalInfo.pending_changes = null;
  generalInfo.biodata_status = "approved";
  generalInfo.version = (generalInfo.version || 1) + 1;
  generalInfo.admin_note = "";
  generalInfo.last_approved_at = new Date();
  await generalInfo.save();

  res.status(200).json({
    message: "Changes saved and published automatically.",
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

// Admin approves pending biodata changes
const approveBiodataChanges = catchAsync(async (req: Request, res: Response) => {
  const biodataId = req.params.id;
  const adminId = req.user?._id;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      message: "You are not authorized",
    });
  }

  const generalInfo = await GeneralInfo.findById(biodataId);
  if (!generalInfo) {
    return res.status(404).json({
      success: false,
      message: "Biodata not found",
    });
  }

  if (generalInfo.biodata_status !== 'pending' || !generalInfo.pending_changes) {
    return res.status(400).json({
      success: false,
      message: "No pending changes to approve",
    });
  }

  // Merge pending_changes into approved_data
  generalInfo.approved_data = {
    ...generalInfo.approved_data,
    ...generalInfo.pending_changes,
  };

  // Increment version and update approval metadata
  generalInfo.version = (generalInfo.version || 1) + 1;
  generalInfo.biodata_status = 'approved';
  generalInfo.pending_changes = null;
  generalInfo.admin_note = '';
  generalInfo.last_approved_at = new Date();
  generalInfo.last_approved_by = adminId;

  await generalInfo.save();

  res.status(200).json({
    success: true,
    message: `Biodata version ${generalInfo.version} approved and published`,
    data: generalInfo,
  });
});

// Admin rejects pending biodata changes
const rejectBiodataChanges = catchAsync(async (req: Request, res: Response) => {
  const biodataId = req.params.id;
  const adminId = req.user?._id;
  const { reason = '' } = req.body;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      message: "You are not authorized",
    });
  }

  const generalInfo = await GeneralInfo.findById(biodataId);
  if (!generalInfo) {
    return res.status(404).json({
      success: false,
      message: "Biodata not found",
    });
  }

  if (generalInfo.biodata_status !== 'pending' || !generalInfo.pending_changes) {
    return res.status(400).json({
      success: false,
      message: "No pending changes to reject",
    });
  }

  // Discard pending changes and revert to approved version
  generalInfo.pending_changes = null;
  generalInfo.biodata_status = 'rejected';
  generalInfo.admin_note = reason;
  generalInfo.last_approved_at = new Date();
  generalInfo.last_approved_by = adminId;

  await generalInfo.save();

  res.status(200).json({
    success: true,
    message: "Biodata changes rejected. Previous approved version remains live.",
    data: generalInfo,
  });
});

// Preserve the existing endpoint while publishing any legacy pending changes immediately.
const submitForReview = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const generalInfo = await GeneralInfo.findOne({ user: userId });
  if (!generalInfo) {
    return res.status(404).json({ success: false, message: "Biodata not found" });
  }

  if (generalInfo.pending_changes) {
    generalInfo.approved_data = {
      ...(generalInfo.approved_data || {}),
      ...generalInfo.pending_changes,
    };
    generalInfo.version = (generalInfo.version || 1) + 1;
  }

  generalInfo.pending_changes = null;
  generalInfo.biodata_status = "approved";
  generalInfo.admin_note = "";
  generalInfo.last_approved_at = new Date();
  await generalInfo.save();

  res.status(200).json({
    success: true,
    message: "Biodata approved and published automatically.",
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
  approveBiodataChanges,
  rejectBiodataChanges,
  submitForReview,
};
