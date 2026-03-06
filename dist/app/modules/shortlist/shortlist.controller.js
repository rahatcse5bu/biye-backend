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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShortlistController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const mongoose_1 = __importDefault(require("mongoose"));
const shortlist_model_1 = __importDefault(require("./shortlist.model"));
exports.ShortlistController = {
    // Toggle shortlist (add if not exists, remove if exists)
    toggleShortlist: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const { bio_user } = req.body;
        const user = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!user) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        if (String(user) === String(bio_user)) {
            return res.status(http_status_1.default.BAD_REQUEST).json({
                success: false,
                message: "You cannot shortlist yourself",
            });
        }
        const MAX_RETRIES = 3;
        let retries = 0;
        while (retries < MAX_RETRIES) {
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                const existingShortlist = yield shortlist_model_1.default.findOne({
                    user,
                    bio_user,
                }).session(session);
                if (existingShortlist) {
                    yield shortlist_model_1.default.findOneAndDelete({ user, bio_user }).session(session);
                    yield session.commitTransaction();
                    session.endSession();
                    return res.json({
                        success: true,
                        message: "Shortlist was successfully removed.",
                        data: { shortlisted: false },
                    });
                }
                else {
                    yield shortlist_model_1.default.create([{ user, bio_user }], { session });
                    yield session.commitTransaction();
                    session.endSession();
                    return res.json({
                        success: true,
                        message: "Shortlist was successfully added.",
                        data: { shortlisted: true },
                    });
                }
            }
            catch (error) {
                yield session.abortTransaction();
                session.endSession();
                if (error.code === 112) {
                    retries++;
                    console.warn(`Retrying shortlist transaction, attempt ${retries}`);
                    yield new Promise((resolve) => setTimeout(resolve, 100 * retries));
                }
                else {
                    console.error("Error toggling shortlist:", error);
                    return res.status(500).json({
                        success: false,
                        message: "Internal server error",
                    });
                }
            }
        }
        return res.status(500).json({
            success: false,
            message: "Failed to toggle shortlist after multiple attempts.",
        });
    })),
    // Get my shortlist (biodatas I shortlisted)
    getMyShortlist: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        const user = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
        if (!user) {
            return res.status(401).send({
                statusCode: 401,
                message: "You are not authorized",
                success: false,
            });
        }
        const user_mongo_id = new mongoose_1.default.Types.ObjectId(String(user));
        const results = yield shortlist_model_1.default.aggregate([
            { $match: { user: user_mongo_id, bio_user: { $ne: user_mongo_id } } },
            {
                $lookup: {
                    from: "addresses",
                    localField: "bio_user",
                    foreignField: "user",
                    as: "address",
                },
            },
            { $unwind: { path: "$address", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "users",
                    localField: "bio_user",
                    foreignField: "_id",
                    as: "user_info",
                },
            },
            { $unwind: { path: "$user_info", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "generalinfos",
                    localField: "bio_user",
                    foreignField: "user",
                    as: "general_info",
                },
            },
            { $unwind: { path: "$general_info", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    bio_id: "$user_info.user_id",
                    bio_user: "$bio_user",
                    permanent_address: "$address.permanent_address",
                    date_of_birth: "$general_info.date_of_birth",
                    screen_color: "$general_info.screen_color",
                    createdAt: 1,
                },
            },
            { $sort: { createdAt: -1 } },
        ]);
        res.status(200).json({
            success: true,
            message: "My shortlist retrieved successfully",
            data: results,
        });
    })),
    // Get who shortlisted me (users who shortlisted my biodata)
    getWhoShortlistedMe: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _c;
        const bio_user = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id;
        if (!bio_user) {
            return res.status(401).send({
                statusCode: 401,
                message: "You are not authorized",
                success: false,
            });
        }
        const user_mongo_id = new mongoose_1.default.Types.ObjectId(String(bio_user));
        const results = yield shortlist_model_1.default.aggregate([
            {
                $match: {
                    bio_user: user_mongo_id,
                    user: { $ne: user_mongo_id },
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
            { $unwind: { path: "$address", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "generalinfos",
                    localField: "user",
                    foreignField: "user",
                    as: "general_info",
                },
            },
            { $unwind: { path: "$general_info", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user_info",
                },
            },
            { $unwind: { path: "$user_info", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    bio_id: "$user_info.user_id",
                    bio_user: "$user",
                    permanent_address: "$address.permanent_address",
                    date_of_birth: "$general_info.date_of_birth",
                    screen_color: "$general_info.screen_color",
                    createdAt: 1,
                },
            },
            { $sort: { createdAt: -1 } },
        ]);
        res.status(200).json({
            success: true,
            message: "Who shortlisted me retrieved successfully",
            data: results,
        });
    })),
    // Check if a bio_user is shortlisted
    checkShortlist: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _d, _e;
        const user = (_d = req.user) === null || _d === void 0 ? void 0 : _d._id;
        const bio_user = (_e = req.params) === null || _e === void 0 ? void 0 : _e.id;
        if (!user) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const data = yield shortlist_model_1.default.findOne({ user, bio_user });
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Shortlist check result",
            data: { shortlisted: !!data },
        });
    })),
};
