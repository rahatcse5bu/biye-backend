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
const getGeneralInfo = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
const getGeneralInfoByToken = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log(req.user);
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
};
