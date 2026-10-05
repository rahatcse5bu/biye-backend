"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneralInfoController = void 0;
const SendSuccess_1 = require("../../../shared/SendSuccess");
const http_status_1 = __importDefault(require("http-status"));
const general_info_model_1 = __importDefault(require("./general_info.model"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const user_info_services_1 = require("../user_info/user_info.services");
const mongoose_1 = __importDefault(require("mongoose"));
const favourites_model_1 = __importDefault(require("../favourites/favourites.model"));
const unfavorites_model_1 = __importDefault(require("../unfavorites/unfavorites.model"));
const ApiError_1 = __importDefault(require("../../middlewares/ApiError"));
const contact_purchase_data_model_1 = __importDefault(require("../contact_purchase_data/contact_purchase_data.model"));
const notification_service_1 = require("../notifications/notification.service");
const bibahoMail_1 = require("../../../shared/bibahoMail");
const getGeneralInfo = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const { bio_type, marital_status, isFeatured, zilla, limit = 10, page = 1, user_status = "active", division, sortBy = "createdAt", sortOrder = "desc", 
    // New filter parameters
    gender, minAge, maxAge, minHeight, maxHeight, complexion, // screen_color
    education_medium, deeni_edu, occupation, fiqh, economic_status, categories, permanent_address, current_upzilla, upazila, current_division, current_zilla, 
    // Religion filters
    religion, religious_type, 
    // English alias filters (for API/agent use — avoids Bengali in query params)
    bio_gender, // 'male' | 'female'  →  maps to bio_type Bengali value
    marital_status_en, // 'unmarried'|'married'|'divorced'|'widow'|'widower'
    // Expected partner filters
    exp_zilla, exp_marital_status, exp_occupation, exp_economical_condition, exp_educational_qualifications, } = req.query;
    const toStringArray = (value) => {
        const values = Array.isArray(value) ? value : [value];
        return values
            .flatMap((item) => (typeof item === "string" ? item.split(",") : []))
            .map((item) => item.trim())
            .filter(Boolean);
    };
    const firstQueryValue = (value) => toStringArray(value)[0];
    // Resolve bio_type from English aliases. Both common Unicode spellings are
    // accepted because legacy records contain both বায়োডাটা and বায়োডাটা.
    const BIO_GENDER_MAP = {
        male: ["পাত্রের বায়োডাটা", "পাত্রের বায়োডাটা"],
        groom: ["পাত্রের বায়োডাটা", "পাত্রের বায়োডাটা"],
        female: ["পাত্রীর বায়োডাটা", "পাত্রীর বায়োডাটা"],
        bride: ["পাত্রীর বায়োডাটা", "পাত্রীর বায়োডাটা"],
    };
    const bioGenderAlias = (_a = firstQueryValue(bio_gender)) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    const resolvedBioTypes = bioGenderAlias && BIO_GENDER_MAP[bioGenderAlias]
        ? BIO_GENDER_MAP[bioGenderAlias]
        : toStringArray(bio_type);
    // Resolve marital_status from English alias if provided
    const MARITAL_EN_MAP = {
        unmarried: "অবিবাহিত",
        single: "অবিবাহিত",
        married: "বিবাহিত",
        divorced: "ডিভোর্সড",
        widow: "বিধবা",
        widowed: "বিধবা",
        widower: "বিপত্নীক",
    };
    const maritalStatusAlias = (_b = firstQueryValue(marital_status_en)) === null || _b === void 0 ? void 0 : _b.toLowerCase();
    const resolvedMaritalStatuses = maritalStatusAlias && MARITAL_EN_MAP[maritalStatusAlias]
        ? [MARITAL_EN_MAP[maritalStatusAlias]]
        : toStringArray(marital_status);
    // These expressions define the canonical values returned by the public API.
    // They are installed before filtering in both the count and data pipelines.
    const canonicalPublicFields = {
        bio_type: { $ifNull: ["$approved_data.bio_type", "$bio_type"] },
        marital_status: {
            $ifNull: ["$approved_data.marital_status", "$marital_status"],
        },
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
    const andConditions = [
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
                        $ifNull: ["$approved_data.religious_type", "$religious_type"],
                    },
                    religiousTypeValue,
                ],
            },
        });
    }
    const parseFiniteNumber = (value) => {
        const rawValue = firstQueryValue(value);
        if (rawValue === undefined)
            return undefined;
        const parsedValue = Number(rawValue);
        return Number.isFinite(parsedValue) ? parsedValue : undefined;
    };
    const parseAge = (value) => {
        const parsedValue = parseFiniteNumber(value);
        return parsedValue !== undefined && parsedValue >= 0
            ? Math.floor(parsedValue)
            : undefined;
    };
    // Return the same calendar day N years ago, clamping leap day to the final
    // day of February when the target year is not a leap year.
    const calendarDateYearsAgo = (date, years) => {
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
        const ageConditions = {};
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        if (maxAgeNumber !== undefined) {
            const oldestIncludedBirthDate = calendarDateYearsAgo(startOfToday, maxAgeNumber + 1);
            oldestIncludedBirthDate.setDate(oldestIncludedBirthDate.getDate() + 1);
            ageConditions.$gte = oldestIncludedBirthDate;
        }
        if (minAgeNumber !== undefined) {
            const youngestIncludedBirthDate = calendarDateYearsAgo(startOfToday, minAgeNumber);
            youngestIncludedBirthDate.setHours(23, 59, 59, 999);
            ageConditions.$lte = youngestIncludedBirthDate;
        }
        andConditions.push({ date_of_birth: ageConditions });
    }
    // Height filter against the approved-first canonical public value
    const minHeightNumber = parseFiniteNumber(minHeight);
    const maxHeightNumber = parseFiniteNumber(maxHeight);
    if (minHeightNumber !== undefined || maxHeightNumber !== undefined) {
        const heightConditions = {};
        if (minHeightNumber !== undefined)
            heightConditions.$gte = minHeightNumber;
        if (maxHeightNumber !== undefined)
            heightConditions.$lte = maxHeightNumber;
        andConditions.push({ height: heightConditions });
    }
    // Complexion filter against the approved-first canonical screen_color
    const complexionValues = toStringArray(complexion);
    if (complexionValues.length > 0) {
        andConditions.push({ screen_color: { $in: complexionValues } });
    }
    // Permanent Address Filters: Division, Zilla, Upazila
    const divisionValues = toStringArray(division);
    if (divisionValues.length > 0 &&
        !divisionValues.some((value) => value.toLowerCase() === "all")) {
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
    if (currentDivisionValues.length > 0 &&
        !currentDivisionValues.some((value) => value.toLowerCase() === "all")) {
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
    const permanentAddressValue = (_c = firstQueryValue(permanent_address)) === null || _c === void 0 ? void 0 : _c.trim();
    if (permanentAddressValue) {
        const escapedPermanentAddress = permanentAddressValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    const parseInteger = (value, fallback) => {
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
    const sortDirection = ((_d = firstQueryValue(sortOrder)) === null || _d === void 0 ? void 0 : _d.toLowerCase()) === "asc" ? 1 : -1;
    const sortSpec = { [sortField]: sortDirection };
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
    const additionalMatches = {};
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
    const expectedPartnerMatches = {};
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
    const expectedEconomicConditionValues = toStringArray(exp_economical_condition);
    if (expectedEconomicConditionValues.length > 0) {
        expectedPartnerMatches["expectedPartner.economical_condition"] = {
            $in: expectedEconomicConditionValues,
        };
    }
    const expectedEducationValues = toStringArray(exp_educational_qualifications);
    if (expectedEducationValues.length > 0) {
        expectedPartnerMatches["expectedPartner.educational_qualifications"] = {
            $in: expectedEducationValues,
        };
    }
    const publicValueMatches = Object.assign(Object.assign(Object.assign(Object.assign({}, (resolvedBioTypes.length > 0 && {
        bio_type: { $in: resolvedBioTypes },
    })), (resolvedMaritalStatuses.length > 0 && {
        marital_status: { $in: resolvedMaritalStatuses },
    })), additionalMatches), expectedPartnerMatches);
    // Count and data retrieval share these exact stages to prevent filter drift.
    // Canonical public fields are set before every match that references them.
    const publicFilterStages = [
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userDetails",
            },
        },
        { $addFields: { userDetails: { $first: "$userDetails" } } },
        { $match: { userDetails: { $ne: null } } },
        {
            $lookup: {
                from: "addresses",
                localField: "user",
                foreignField: "user",
                as: "address",
            },
        },
        { $addFields: { address: { $first: "$address" } } },
        {
            $lookup: {
                from: "educationalqualifications",
                localField: "user",
                foreignField: "user",
                as: "education",
            },
        },
        { $addFields: { education: { $first: "$education" } } },
        {
            $lookup: {
                from: "occupations",
                localField: "user",
                foreignField: "user",
                as: "occupation",
            },
        },
        { $addFields: { occupation: { $first: "$occupation" } } },
        {
            $lookup: {
                from: "personalinfos",
                localField: "user",
                foreignField: "user",
                as: "personalInfo",
            },
        },
        { $addFields: { personalInfo: { $first: "$personalInfo" } } },
        {
            $lookup: {
                from: "familystatuses",
                localField: "user",
                foreignField: "user",
                as: "familyStatus",
            },
        },
        { $addFields: { familyStatus: { $first: "$familyStatus" } } },
        {
            $lookup: {
                from: "expectedpartners",
                localField: "user",
                foreignField: "user",
                as: "expectedPartner",
            },
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
    const countPipeline = [
        ...publicFilterStages,
        { $count: "totalCount" },
    ];
    // Get the total count
    const totalResult = yield general_info_model_1.default.aggregate(countPipeline);
    const totalCount = totalResult.length > 0 ? totalResult[0].totalCount : 0;
    const dataPipeline = [
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
                blood_group: {
                    $ifNull: ["$approved_data.blood_group", "$blood_group"],
                },
                screen_color: 1,
                nationality: {
                    $ifNull: ["$approved_data.nationality", "$nationality"],
                },
                marital_status: 1,
                religion: {
                    $ifNull: [
                        "$approved_data.religion",
                        { $ifNull: ["$religion", "islam"] },
                    ],
                },
                religious_type: {
                    $ifNull: ["$approved_data.religious_type", "$religious_type"],
                },
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
    const generalInfos = yield general_info_model_1.default.aggregate(dataPipeline);
    res.status(200).json({
        success: true,
        message: "All General info retrieved successfully",
        data: generalInfos,
        page: pageNumber,
        limit: limitNumber,
        size: totalCount, // Include the total count in the response
    });
}));
const getGeneralInfoByAdmin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { bio_type, marital_status, isFeatured, zilla, limit = 10, page = 1, user_status = "active", } = req.query;
    const andConditions = [
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
                from: "users",
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
                    $match: Object.assign(Object.assign(Object.assign({}, (bio_type && { bio_type })), (marital_status && { marital_status })), (zilla && { zilla })),
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
    const generalInfos = yield general_info_model_1.default.aggregate(pipeline);
    res.status(200).json({
        success: true,
        message: "All General info retrieved successfully",
        data: generalInfos,
        page: pageNumber,
        limit: limitNumber,
        size: generalInfos.length,
    });
}));
const getFeaturedGeneralInfo = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { bio_type, marital_status, zilla, limit = 10, page = 1 } = req.query;
    // Parse limit and page to numbers
    const limitNumber = Number(limit);
    const pageNumber = Number(page);
    // Construct aggregation pipeline
    const pipeline = [
        {
            $lookup: {
                from: "users",
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
                    $match: Object.assign(Object.assign(Object.assign({}, (bio_type && { bio_type })), (marital_status && { marital_status })), (zilla && { zilla })),
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
                date_of_birth: {
                    $ifNull: ["$approved_data.date_of_birth", "$date_of_birth"],
                },
                height: { $ifNull: ["$approved_data.height", "$height"] },
                gender: { $ifNull: ["$approved_data.gender", "$gender"] },
                weight: { $ifNull: ["$approved_data.weight", "$weight"] },
                blood_group: {
                    $ifNull: ["$approved_data.blood_group", "$blood_group"],
                },
                screen_color: {
                    $ifNull: ["$approved_data.screen_color", "$screen_color"],
                },
                nationality: {
                    $ifNull: ["$approved_data.nationality", "$nationality"],
                },
                marital_status: {
                    $ifNull: ["$approved_data.marital_status", "$marital_status"],
                },
                religion: { $ifNull: ["$approved_data.religion", "$religion"] },
                religious_type: {
                    $ifNull: ["$approved_data.religious_type", "$religious_type"],
                },
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
    const generalInfos = yield general_info_model_1.default.aggregate(pipeline);
    res.status(200).json({
        success: true,
        message: "All General info retrieved successfully",
        data: generalInfos,
        page: pageNumber,
        limit: limitNumber,
        size: generalInfos.length,
    });
}));
const getGeneralInfoByUserId = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    const userId = req.params.id;
    const generalInfo = yield general_info_model_1.default.findOne({ user_id: userId });
    if (!generalInfo) {
        return res.status(404).json({
            message: "General info not found for the specified user_id",
            success: false,
        });
    }
    // Public view: serve approved_data snapshot if available
    let publicData = generalInfo.toObject();
    if (publicData.approved_data) {
        const { approved_data, pending_changes, admin_note } = publicData, meta = __rest(publicData, ["approved_data", "pending_changes", "admin_note"]);
        publicData = Object.assign(Object.assign(Object.assign({}, meta), approved_data), { photos: (_e = approved_data.photos) !== null && _e !== void 0 ? _e : meta.photos });
    }
    res.status(200).json({
        message: "General info retrieved successfully",
        success: true,
        data: publicData,
    });
}));
const getGeneralInfoDashboardByUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(req === null || req === void 0 ? void 0 : req.user)) {
        throw new ApiError_1.default(400, "You are not authorized");
    }
    const user = req.user._id;
    const [generalInfo, favorite, unFavorite, contactPurchase] = yield Promise.all([
        general_info_model_1.default.findOne({ user: user }).select("likes_count views_count").lean(),
        favourites_model_1.default.countDocuments({ user }),
        unfavorites_model_1.default.countDocuments({ user }),
        contact_purchase_data_model_1.default.countDocuments({ user }),
    ]);
    // TODO: users without a biodata still get their own counts; likes/views are just 0.
    const responseData = {
        has_biodata: Boolean(generalInfo),
        likes_count: (generalInfo === null || generalInfo === void 0 ? void 0 : generalInfo.likes_count) || 0,
        views_count: (generalInfo === null || generalInfo === void 0 ? void 0 : generalInfo.views_count) || 0,
        favorite_count: favorite,
        unFavorite_count: unFavorite,
        contact_purchase_count: contactPurchase,
    };
    res.status(200).json({
        message: "General info retrieved successfully",
        success: true,
        data: responseData,
    });
}));
const getGeneralInfoByToken = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    // console.log(req.user);
    const generalInfo = yield general_info_model_1.default.findOne({ user: (_f = req.user) === null || _f === void 0 ? void 0 : _f._id });
    if (!generalInfo) {
        return res.status(404).json({
            message: "General info not found",
            success: false,
        });
    }
    // Merge pending_changes over top-level fields so the user sees their own latest edits
    let responseData = generalInfo.toObject();
    if (responseData.pending_changes &&
        typeof responseData.pending_changes === "object") {
        responseData = Object.assign(Object.assign({}, responseData), responseData.pending_changes);
    }
    // Ensure religion defaults to 'islam' if not set
    if (!responseData.religion) {
        responseData.religion = "islam";
    }
    res.status(200).json({
        message: "General info retrieved successfully",
        success: true,
        data: responseData,
    });
}));
const getSingleGeneralInfo = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    const generalInfo = yield general_info_model_1.default.findById(userId);
    if (!generalInfo) {
        return res.status(404).json({
            message: "General info not found",
            success: false,
        });
    }
    // Admin view: merge pending_changes so admin sees the latest user edits
    let responseData = generalInfo.toObject();
    if (responseData.pending_changes &&
        typeof responseData.pending_changes === "object") {
        responseData = Object.assign(Object.assign({}, responseData), responseData.pending_changes);
    }
    // Ensure religion defaults to 'islam' if not set
    if (!responseData.religion) {
        responseData.religion = "islam";
    }
    res
        .status(200)
        .json((0, SendSuccess_1.sendSuccess)("General info retrieved", responseData, 200));
}));
const createGeneralInfo = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _g;
    const _h = req.body, { user_form } = _h, data = __rest(_h, ["user_form"]);
    if (!((_g = req.user) === null || _g === void 0 ? void 0 : _g._id)) {
        return res.status(401).send({
            statusCode: http_status_1.default.UNAUTHORIZED,
            message: "You are not authorized",
            success: false,
        });
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        data.user = req.user._id;
        const approvedData = Object.assign({}, data);
        data.approved_data = approvedData;
        data.pending_changes = null;
        data.biodata_status = "approved";
        data.last_approved_at = new Date();
        // Insert general_information into the database
        const generalInfo = new general_info_model_1.default(data);
        yield generalInfo.save({ session });
        const user = yield user_info_services_1.UserInfoService.getUserInfoByIdWithSession(req.user._id, { session });
        if (!user) {
            yield session.abortTransaction();
            session.endSession();
            return res.status(404).send({
                statusCode: http_status_1.default.NOT_FOUND,
                message: "User not found",
                success: false,
            });
        }
        // Update the fields edited_timeline_index and last_edited_timeline_index of user_info table
        user.edited_timeline_index = Math.max(user.edited_timeline_index, user_form);
        user.last_edited_timeline_index = user_form;
        yield user.save({ session });
        yield session.commitTransaction();
        session.endSession();
        notification_service_1.NotificationService.notify({
            audience: "admin",
            type: "biodata",
            title: "নতুন বায়োডাটা",
            message: `${user.email || "একজন ব্যবহারকারী"} একটি নতুন বায়োডাটা তৈরি করেছেন।`,
            link: "/biodatas",
        });
        res.status(201).json({
            success: true,
            message: "General info created and user_info updated successfully",
        });
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error; // You might want to handle the error more gracefully in a real application
    }
}));
const updateGeneralInfo = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _j;
    const data = req.body;
    const userId = (_j = req.user) === null || _j === void 0 ? void 0 : _j._id;
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "You are not authorized",
        });
    }
    // Check if General info for the user with the given ID exists
    let generalInfo = yield general_info_model_1.default.findOne({ user: userId });
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
    const approvedChanges = {};
    Object.keys(data).forEach((key) => {
        if (!metaFields.includes(key)) {
            generalInfo[key] = data[key];
            approvedChanges[key] = data[key];
        }
    });
    generalInfo.approved_data = Object.assign(Object.assign({}, (generalInfo.approved_data || {})), approvedChanges);
    generalInfo.pending_changes = null;
    generalInfo.biodata_status = "approved";
    generalInfo.version = (generalInfo.version || 1) + 1;
    generalInfo.admin_note = "";
    generalInfo.last_approved_at = new Date();
    yield generalInfo.save();
    res.status(200).json({
        message: "Changes saved and published automatically.",
        success: true,
        data: generalInfo,
    });
}));
const updateWatchOfBioData = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const bioId = req.params.id;
    // Check if General info for the user with the given ID exists
    const generalInfo = yield general_info_model_1.default.findById(bioId);
    if (!generalInfo) {
        return res.status(404).json({
            success: false,
            message: "General info not found",
        });
    }
    generalInfo.views_count = generalInfo.views_count + 1;
    yield generalInfo.save();
    res.status(200).json({
        message: "Updated watch count",
        success: true,
    });
}));
const deleteGeneralInfo = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    // Check if general_info for the user with the given ID exists
    const generalInfo = yield general_info_model_1.default.findById(userId);
    if (!generalInfo) {
        return res.status(404).json({
            success: false,
            message: "general_info not found",
        });
    }
    // Delete the general info
    yield general_info_model_1.default.findByIdAndDelete(userId);
    res.status(200).json({
        success: true,
        message: "General info deleted successfully",
    });
}));
// Admin approves pending biodata changes
const approveBiodataChanges = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _k;
    const biodataId = req.params.id;
    const adminId = (_k = req.user) === null || _k === void 0 ? void 0 : _k._id;
    if (!adminId) {
        return res.status(401).json({
            success: false,
            message: "You are not authorized",
        });
    }
    const generalInfo = yield general_info_model_1.default.findById(biodataId);
    if (!generalInfo) {
        return res.status(404).json({
            success: false,
            message: "Biodata not found",
        });
    }
    if (generalInfo.biodata_status !== "pending" ||
        !generalInfo.pending_changes) {
        return res.status(400).json({
            success: false,
            message: "No pending changes to approve",
        });
    }
    // Merge pending_changes into approved_data
    generalInfo.approved_data = Object.assign(Object.assign({}, generalInfo.approved_data), generalInfo.pending_changes);
    // Increment version and update approval metadata
    generalInfo.version = (generalInfo.version || 1) + 1;
    generalInfo.biodata_status = "approved";
    generalInfo.pending_changes = null;
    generalInfo.admin_note = "";
    generalInfo.last_approved_at = new Date();
    generalInfo.last_approved_by = adminId;
    yield generalInfo.save();
    notification_service_1.NotificationService.notify({
        recipient: String(generalInfo.user),
        audience: "user",
        type: "moderation",
        title: "বায়োডাটা অনুমোদিত",
        message: "আপনার বায়োডাটার পরিবর্তনগুলো অনুমোদিত ও প্রকাশিত হয়েছে।",
        link: "/user/account/dashboard",
    });
    (0, bibahoMail_1.mailUserById)(generalInfo.user, "আপনার বায়োডাটা অনুমোদিত হয়েছে", {
        title: "আপনার বায়োডাটা অনুমোদিত হয়েছে",
        tone: "success",
        paragraphs: ["অভিনন্দন! আপনার বায়োডাটার পরিবর্তনগুলো অনুমোদিত হয়েছে এবং এখন সবার কাছে প্রকাশিত।"],
        details: [{ label: "সংস্করণ", value: generalInfo.version }],
        action: { label: "ড্যাশবোর্ড দেখুন", path: "/user/account/dashboard" },
    });
    res.status(200).json({
        success: true,
        message: `Biodata version ${generalInfo.version} approved and published`,
        data: generalInfo,
    });
}));
// Admin rejects pending biodata changes
const rejectBiodataChanges = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _l;
    const biodataId = req.params.id;
    const adminId = (_l = req.user) === null || _l === void 0 ? void 0 : _l._id;
    const { reason = "" } = req.body;
    if (!adminId) {
        return res.status(401).json({
            success: false,
            message: "You are not authorized",
        });
    }
    const generalInfo = yield general_info_model_1.default.findById(biodataId);
    if (!generalInfo) {
        return res.status(404).json({
            success: false,
            message: "Biodata not found",
        });
    }
    if (generalInfo.biodata_status !== "pending" ||
        !generalInfo.pending_changes) {
        return res.status(400).json({
            success: false,
            message: "No pending changes to reject",
        });
    }
    // Discard pending changes and revert to approved version
    generalInfo.pending_changes = null;
    generalInfo.biodata_status = "rejected";
    generalInfo.admin_note = reason;
    generalInfo.last_approved_at = new Date();
    generalInfo.last_approved_by = adminId;
    yield generalInfo.save();
    notification_service_1.NotificationService.notify({
        recipient: String(generalInfo.user),
        audience: "user",
        type: "moderation",
        title: "বায়োডাটার পরিবর্তন বাতিল",
        message: reason
            ? `আপনার বায়োডাটার পরিবর্তন বাতিল হয়েছে। কারণ: ${reason}`
            : "আপনার বায়োডাটার পরিবর্তন বাতিল হয়েছে। আগের সংস্করণটি প্রকাশিত আছে।",
        link: "/user/account/edit-biodata",
    });
    (0, bibahoMail_1.mailUserById)(generalInfo.user, "বায়োডাটার পরিবর্তন বাতিল হয়েছে", {
        title: "বায়োডাটার পরিবর্তন বাতিল হয়েছে",
        tone: "warning",
        paragraphs: [
            "আপনার বায়োডাটার সাম্প্রতিক পরিবর্তনগুলো অনুমোদিত হয়নি। আগের অনুমোদিত সংস্করণটি প্রকাশিত আছে।",
            "প্রয়োজনীয় সংশোধন করে আবার জমা দিতে পারেন।",
        ],
        details: [{ label: "কারণ", value: reason }],
        action: { label: "বায়োডাটা সংশোধন করুন", path: "/user/account/edit-biodata" },
    });
    res.status(200).json({
        success: true,
        message: "Biodata changes rejected. Previous approved version remains live.",
        data: generalInfo,
    });
}));
// Preserve the existing endpoint while publishing any legacy pending changes immediately.
const submitForReview = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _m;
    const userId = (_m = req.user) === null || _m === void 0 ? void 0 : _m._id;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const generalInfo = yield general_info_model_1.default.findOne({ user: userId });
    if (!generalInfo) {
        return res
            .status(404)
            .json({ success: false, message: "Biodata not found" });
    }
    if (generalInfo.pending_changes) {
        generalInfo.approved_data = Object.assign(Object.assign({}, (generalInfo.approved_data || {})), generalInfo.pending_changes);
        generalInfo.version = (generalInfo.version || 1) + 1;
    }
    generalInfo.pending_changes = null;
    generalInfo.biodata_status = "approved";
    generalInfo.admin_note = "";
    generalInfo.last_approved_at = new Date();
    yield generalInfo.save();
    (0, bibahoMail_1.mailUserById)(userId, "আপনার বায়োডাটা জমা হয়েছে", {
        title: "আপনার বায়োডাটা সফলভাবে জমা হয়েছে",
        tone: "success",
        paragraphs: [
            "ধন্যবাদ! আপনার বায়োডাটা জমা ও প্রকাশিত হয়েছে। এখন অন্য সদস্যরা আপনার বায়োডাটা দেখতে ও আপনার সাথে যোগাযোগের অনুরোধ পাঠাতে পারবেন।",
            "যেকোনো সময় আপনার বায়োডাটা আপডেট করতে পারবেন।",
        ],
        details: [
            { label: "বায়োডাটা ধরন", value: generalInfo.bio_type },
            { label: "সংস্করণ", value: generalInfo.version },
        ],
        action: { label: "ড্যাশবোর্ড দেখুন", path: "/user/account/dashboard" },
    });
    res.status(200).json({
        success: true,
        message: "Biodata approved and published automatically.",
    });
}));
exports.GeneralInfoController = {
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
