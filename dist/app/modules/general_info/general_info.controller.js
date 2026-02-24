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
                "present_address.division": { $in: current_division.split(",") },
            });
        }
        else if (Array.isArray(current_division)) {
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
        }
        else if (Array.isArray(current_zilla)) {
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
        }
        else if (Array.isArray(current_upzilla)) {
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
            additionalMatches["familyStatus.financial_situation"] = { $in: economic_status.split(",") };
        }
        else if (Array.isArray(economic_status)) {
            additionalMatches["familyStatus.financial_situation"] = { $in: economic_status };
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
        // Optionally project to remove user details from final output if not needed
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
        // Optionally project to remove user details from final output if not needed
        {
            $project: {
                _id: 1,
                user_id: "$userDetails.user_id",
                user: "$userDetails._id",
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
    res.status(200).json({
        message: "General info retrieved successfully",
        success: true,
        data: generalInfo,
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
    res.status(200).json({
        message: "General info retrieved successfully",
        success: true,
        data: generalInfo,
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
    res.status(200).json((0, SendSuccess_1.sendSuccess)("General info retrieved", generalInfo, 200));
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
    const generalInfo = yield general_info_model_1.default.findOne({ user: userId });
    if (!generalInfo) {
        return res.status(404).json({
            success: false,
            message: "General info not found",
        });
    }
    // Update the general info with the new data
    Object.assign(generalInfo, data);
    yield generalInfo.save();
    res.status(200).json({
        message: "Update successfully completed",
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
};
