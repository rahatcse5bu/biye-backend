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
exports.UnFavoriteController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const mongoose_1 = __importDefault(require("mongoose"));
const unfavorites_service_1 = require("./unfavorites.service");
const unfavorites_model_1 = __importDefault(require("./unfavorites.model"));
exports.UnFavoriteController = {
    getAllUnFavorites: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const unUnFavorites = yield unfavorites_service_1.UnFavoriteService.getAllUnFavorites();
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "All unUnFavorites retrieved successfully",
            data: unUnFavorites,
        });
    })),
    getUnFavoriteById: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const id = req.params.id;
        const unUnFavorite = yield unfavorites_service_1.UnFavoriteService.getUnFavoriteById(id);
        if (!unUnFavorite) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "UnFavorite not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "UnFavorite retrieved successfully",
                data: unUnFavorite,
            });
        }
    })),
    getUnFavoriteByToken: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const unUnFavorite = yield unfavorites_service_1.UnFavoriteService.getUnFavoriteByToken(userId);
        if (!unUnFavorite) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "UnFavorite not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "UnFavorite retrieved successfully",
                data: unUnFavorite,
            });
        }
    })),
    // createUnFavorite: catchAsync(async (req: Request, res: Response) => {
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
    //     const existingUnFavorite = await UnFavorite.findOne({
    //       user,
    //       bio_user,
    //     }).session(session);
    //     if (existingUnFavorite) {
    //       // If the unUnFavorite exists, delete it and decrement likes_count
    //       await UnFavorite.findOneAndDelete({
    //         user,
    //         bio_user,
    //       }).session(session);
    //       return res.json({
    //         success: true,
    //         message: "UnFavorite was successfully deleted.",
    //       });
    //     } else {
    //       // If the unUnFavorite doesn't exist, create it and increment likes_count
    //       await UnFavorite.create([{ user, bio_user }], {
    //         session,
    //       });
    //       return res.json({
    //         success: true,
    //         message: "UnFavorite was successfully added.",
    //       });
    //     }
    //   } catch (error) {
    //     // If any error occurs, abort the transaction
    //     await session.abortTransaction();
    //     session.endSession();
    //     console.error("Error creating or deleting unUnFavorite:", error);
    //     return res.status(500).json({
    //       success: false,
    //       message: "Internal server error",
    //     });
    //   }
    // }),
    createUnFavorite: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        const { bio_user } = req.body;
        const user = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
        if (!user) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const existingUnFavorite = yield unfavorites_model_1.default.findOne({
                user,
                bio_user,
            }).session(session);
            if (existingUnFavorite) {
                yield unfavorites_model_1.default.findOneAndDelete({ user, bio_user }).session(session);
                yield session.commitTransaction();
                return res.json({
                    success: true,
                    message: "UnFavorite was successfully deleted.",
                });
            }
            else {
                yield unfavorites_model_1.default.create([{ user, bio_user }], { session });
                yield session.commitTransaction();
                return res.json({
                    success: true,
                    message: "UnFavorite was successfully added.",
                });
            }
        }
        catch (error) {
            yield session.abortTransaction();
            console.error("Error creating or deleting unUnFavorite:", error);
            return res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
        finally {
            session.endSession();
        }
    })),
    updateUnFavorite: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _c;
        const id = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id;
        if (!id) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const updatedFields = req.body;
        const updatedUnFavorite = yield unfavorites_service_1.UnFavoriteService.updateUnFavorite(id, updatedFields);
        if (!updatedUnFavorite) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "UnFavorite not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "UnFavorite updated successfully",
                data: updatedUnFavorite,
            });
        }
    })),
    checkDisLikes: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        let data = yield unfavorites_model_1.default.findOne({
            user,
            bio_user,
        });
        let result = false;
        if (data) {
            result = true;
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Retrieve checks",
            data: result,
        });
    })),
    deleteUnFavorite: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const id = req.params.id;
        yield unfavorites_service_1.UnFavoriteService.deleteUnFavorite(id);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "UnFavorite deleted successfully",
        });
    })),
};
