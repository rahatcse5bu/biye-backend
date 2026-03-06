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
const getGeneralInfo = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { bio_type, marital_status, isFeatured, zilla, limit = 10, page = 1, user_status = "active", division, sortBy = "createdAt", sortOrder = "desc", 
    // New filter parameters
    gender, minAge, maxAge, minHeight, maxHeight, complexion, // screen_color
    education_medium, deeni_edu, occupation, fiqh, economic_status, categories, permanent_address, current_upzilla, upazila, current_division, current_zilla, 
    // Religion filters
    religion, religious_type, } = req.query;
    const andConditions = [
        {
            "userDetails.user_status": user_status,
        },
    ];
    // Gender filter
    if (gender) {
        andConditions.push({ gender });
    }
    // Religion filter - check both top-level and approved_data
    // Also match null/missing religion as "islam" (the default)
    if (religion) {
        const religionConditions = [
            { religion },
            { "approved_data.religion": religion },
        ];
        // Documents with null/missing religion default to islam
        if (religion === "islam") {
            religionConditions.push({ religion: null });
            religionConditions.push({ religion: { $exists: false } });
        }
        andConditions.push({ $or: religionConditions });
    }
    // Religious type filter - check both top-level and approved_data
    if (religious_type) {
        andConditions.push({
            $or: [
                { religious_type },
                { "approved_data.religious_type": religious_type },
            ],
        });
    }
    // Age filter (calculated from date_of_birth)
    if (minAge || maxAge) {
        const ageConditions = {};
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
        const heightConditions = {};
        if (minHeight)
            heightConditions.$gte = Number(minHeight);
        if (maxHeight)
            heightConditions.$lte = Number(maxHeight);
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
        }
        else if (Array.isArray(complexion)) {
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
        }
        else if (Array.isArray(division)) {
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
        }
        else if (Array.isArray(zilla)) {
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
        }
        else if (Array.isArray(upazila)) {
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
                "address.present_division": { $in: current_division.split(",") },
            });
        }
        else if (Array.isArray(current_division)) {
            andConditions.push({
                "address.present_division": { $in: current_division },
            });
        }
    }
    // Handle current zilla filter
    if (current_zilla) {
        if (typeof current_zilla === "string") {
            andConditions.push({
                "address.present_zilla": { $in: current_zilla.split(",") },
            });
        }
        else if (Array.isArray(current_zilla)) {
            andConditions.push({
                "address.present_zilla": { $in: current_zilla },
            });
        }
    }
    // Handle current upzilla filter
    if (current_upzilla) {
        if (typeof current_upzilla === "string") {
            andConditions.push({
                "address.present_upzilla": { $in: current_upzilla.split(",") },
            });
        }
        else if (Array.isArray(current_upzilla)) {
            andConditions.push({
                "address.present_upzilla": { $in: current_upzilla },
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
    const additionalMatches = {};
    // Education medium filter
    if (education_medium) {
        if (typeof education_medium === "string") {
            additionalMatches["education.education_medium"] = { $in: education_medium.split(",") };
        }
        else if (Array.isArray(education_medium)) {
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
        }
        else if (Array.isArray(fiqh)) {
            additionalMatches["personalInfo.fiqh"] = { $in: fiqh };
        }
    }
    // Economic status filter
    if (economic_status) {
        if (typeof economic_status === "string") {
            additionalMatches["familyStatus.eco_condition_type"] = { $in: economic_status.split(",") };
        }
        else if (Array.isArray(economic_status)) {
            additionalMatches["familyStatus.eco_condition_type"] = { $in: economic_status };
        }
    }
    // Categories filter
    if (categories) {
        const categoriesArray = typeof categories === "string" ? categories.split(",") : categories;
        additionalMatches["personalInfo.my_categories"] = { $in: categoriesArray };
    }
    // Construct aggregation pipeline for counting total size
    const countPipeline = [
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
            $unwind: { path: "$address", preserveNullAndEmptyArrays: true },
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
                    $match: Object.assign(Object.assign(Object.assign({}, (bio_type && { bio_type })), (marital_status && { marital_status })), additionalMatches),
                },
            ]
            : []),
        {
            $count: "totalCount",
        },
    ];
    // Get the total count
    const totalResult = yield general_info_model_1.default.aggregate(countPipeline);
    const totalCount = totalResult.length > 0 ? totalResult[0].totalCount : 0;
    // Construct aggregation pipeline for actual data retrieval
    const dataPipeline = [
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
            $unwind: { path: "$address", preserveNullAndEmptyArrays: true },
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
                    $match: Object.assign(Object.assign(Object.assign({}, (bio_type && { bio_type })), (marital_status && { marital_status })), additionalMatches),
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
                zilla: "$address.zilla",
                division: "$address.division",
                present_upzilla: "$address.present_upzilla",
                present_zilla: "$address.present_zilla",
                present_division: "$address.present_division",
                bio_type: { $ifNull: ["$approved_data.bio_type", "$bio_type"] },
                date_of_birth: { $ifNull: ["$approved_data.date_of_birth", "$date_of_birth"] },
                height: { $ifNull: ["$approved_data.height", "$height"] },
                gender: { $ifNull: ["$approved_data.gender", "$gender"] },
                weight: { $ifNull: ["$approved_data.weight", "$weight"] },
                blood_group: { $ifNull: ["$approved_data.blood_group", "$blood_group"] },
                screen_color: { $ifNull: ["$approved_data.screen_color", "$screen_color"] },
                nationality: { $ifNull: ["$approved_data.nationality", "$nationality"] },
                marital_status: { $ifNull: ["$approved_data.marital_status", "$marital_status"] },
                religion: { $ifNull: ["$approved_data.religion", { $ifNull: ["$religion", "islam"] }] },
                religious_type: { $ifNull: ["$approved_data.religious_type", "$religious_type"] },
                photos: { $ifNull: ["$pending_changes.photos", { $ifNull: ["$approved_data.photos", "$photos"] }] },
                views_count: 1,
                purchases_count: 1,
                isFbPosted: 1,
                isFeatured: 1,
                dislikes_count: 1,
                likes_count: 1,
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
                photos: { $ifNull: ["$pending_changes.photos", { $ifNull: ["$approved_data.photos", "$photos"] }] },
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
        publicData = Object.assign(Object.assign({}, meta), approved_data);
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
    const generalInfo = yield general_info_model_1.default.findOne({ user: user })
        .select("likes_count views_count")
        .lean();
    const favorite = yield favourites_model_1.default.countDocuments({
        user,
    }).lean();
    const unFavorite = yield unfavorites_model_1.default.countDocuments({
        user,
    }).lean();
    const contactPurchase = yield contact_purchase_data_model_1.default.countDocuments({
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
}));
const getGeneralInfoByToken = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // console.log(req.user);
    const generalInfo = yield general_info_model_1.default.findOne({ user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id });
    if (!generalInfo) {
        return res.status(404).json({
            message: "General info not found",
            success: false,
        });
    }
    // Merge pending_changes over top-level fields so the user sees their own latest edits
    let responseData = generalInfo.toObject();
    if (responseData.pending_changes && typeof responseData.pending_changes === 'object') {
        responseData = Object.assign(Object.assign({}, responseData), responseData.pending_changes);
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
    if (responseData.pending_changes && typeof responseData.pending_changes === 'object') {
        responseData = Object.assign(Object.assign({}, responseData), responseData.pending_changes);
    }
    // Ensure religion defaults to 'islam' if not set
    if (!responseData.religion) {
        responseData.religion = 'islam';
    }
    res.status(200).json((0, SendSuccess_1.sendSuccess)("General info retrieved", responseData, 200));
}));
const createGeneralInfo = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const _c = req.body, { user_form } = _c, data = __rest(_c, ["user_form"]);
    if (!((_b = req.user) === null || _b === void 0 ? void 0 : _b._id)) {
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
    var _d;
    const data = req.body;
    const userId = (_d = req.user) === null || _d === void 0 ? void 0 : _d._id;
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
    // Versioning logic:
    // If this is the first edit (approved_data is null), initialize approved_data from current generalInfo
    if (!generalInfo.approved_data) {
        const currentData = generalInfo.toObject();
        delete currentData._id;
        delete currentData.__v;
        delete currentData.biodata_status;
        delete currentData.pending_changes;
        delete currentData.admin_note;
        delete currentData.version;
        delete currentData.last_approved_at;
        delete currentData.last_approved_by;
        generalInfo.approved_data = currentData;
    }
    // Update top-level document fields directly so data always persists (photos, etc.)
    const metaFields = ['_id', '__v', 'user', 'approved_data', 'pending_changes', 'biodata_status', 'version', 'admin_note', 'last_approved_at', 'last_approved_by'];
    Object.keys(data).forEach((key) => {
        if (!metaFields.includes(key)) {
            generalInfo[key] = data[key];
        }
    });
    // Also save to pending_changes for admin review, set status to pending
    generalInfo.pending_changes = data;
    generalInfo.biodata_status = 'pending';
    yield generalInfo.save();
    res.status(200).json({
        message: "Changes saved. Awaiting admin approval.",
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
    var _e;
    const biodataId = req.params.id;
    const adminId = (_e = req.user) === null || _e === void 0 ? void 0 : _e._id;
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
    if (generalInfo.biodata_status !== 'pending' || !generalInfo.pending_changes) {
        return res.status(400).json({
            success: false,
            message: "No pending changes to approve",
        });
    }
    // Merge pending_changes into approved_data
    generalInfo.approved_data = Object.assign(Object.assign({}, generalInfo.approved_data), generalInfo.pending_changes);
    // Increment version and update approval metadata
    generalInfo.version = (generalInfo.version || 1) + 1;
    generalInfo.biodata_status = 'approved';
    generalInfo.pending_changes = null;
    generalInfo.admin_note = '';
    generalInfo.last_approved_at = new Date();
    generalInfo.last_approved_by = adminId;
    yield generalInfo.save();
    res.status(200).json({
        success: true,
        message: `Biodata version ${generalInfo.version} approved and published`,
        data: generalInfo,
    });
}));
// Admin rejects pending biodata changes
const rejectBiodataChanges = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    const biodataId = req.params.id;
    const adminId = (_f = req.user) === null || _f === void 0 ? void 0 : _f._id;
    const { reason = '' } = req.body;
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
    yield generalInfo.save();
    res.status(200).json({
        success: true,
        message: "Biodata changes rejected. Previous approved version remains live.",
        data: generalInfo,
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
};
