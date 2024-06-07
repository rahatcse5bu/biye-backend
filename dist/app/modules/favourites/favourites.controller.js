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
exports.FavoriteController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const mongoose_1 = __importDefault(require("mongoose"));
const favourites_services_1 = require("./favourites.services");
const favourites_model_1 = __importDefault(require("./favourites.model"));
const general_info_model_1 = __importDefault(require("../general_info/general_info.model"));
exports.FavoriteController = {
    getAllFavorites: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const favorites = yield favourites_services_1.FavoriteService.getAllFavorites();
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "All favorites retrieved successfully",
            data: favorites,
        });
    })),
    getFavoriteById: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const id = req.params.id;
        const favorite = yield favourites_services_1.FavoriteService.getFavoriteById(id);
        if (!favorite) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "Favorite not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "Favorite retrieved successfully",
                data: favorite,
            });
        }
    })),
    getFavoriteByToken: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const favorite = yield favourites_services_1.FavoriteService.getFavoriteByToken(userId);
        if (!favorite) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "Favorite not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "Favorite retrieved successfully",
                data: favorite,
            });
        }
    })),
    createFavorite: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        const MAX_RETRIES = 3; // Maximum number of retries for transient errors
        const { bio_user } = req.body;
        const user = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
        if (!user) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        let retries = 0;
        while (retries < MAX_RETRIES) {
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                const existingFavorite = yield favourites_model_1.default.findOne({
                    user,
                    bio_user,
                }).session(session);
                if (existingFavorite) {
                    const response = yield favourites_model_1.default.findOneAndDelete({
                        user,
                        bio_user,
                    }).session(session);
                    if (response) {
                        const updateUser = yield general_info_model_1.default.findOneAndUpdate({ user: bio_user }, { $inc: { likes_count: -1 } }, { new: true, session });
                        yield session.commitTransaction();
                        session.endSession();
                        return res.json({
                            success: true,
                            message: "Favorite was successfully deleted.",
                        });
                    }
                }
                else {
                    const response = yield favourites_model_1.default.create([{ user, bio_user }], {
                        session,
                    });
                    if (response) {
                        const updateUser = yield general_info_model_1.default.findOneAndUpdate({ user: bio_user }, { $inc: { likes_count: 1 } }, { new: true, session });
                        yield session.commitTransaction();
                        session.endSession();
                        return res.json({
                            success: true,
                            message: "Favorite was successfully added.",
                        });
                    }
                }
            }
            catch (error) {
                yield session.abortTransaction();
                session.endSession();
                if (error.code === 112) {
                    // Transient error code
                    retries++;
                    console.warn(`Retrying transaction, attempt ${retries}`);
                    yield new Promise((resolve) => setTimeout(resolve, 100 * retries)); // Exponential backoff
                }
                else {
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
    })),
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
    updateFavorite: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const updatedFavorite = yield favourites_services_1.FavoriteService.updateFavorite(id, updatedFields);
        if (!updatedFavorite) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "Favorite not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "Favorite updated successfully",
                data: updatedFavorite,
            });
        }
    })),
    checkLikes: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        let data = yield favourites_model_1.default.findOne({
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
    deleteFavorite: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const id = req.params.id;
        yield favourites_services_1.FavoriteService.deleteFavorite(id);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Favorite deleted successfully",
        });
    })),
};
