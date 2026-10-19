"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const user_info_model_1 = require("../user_info/user_info.model");
const mongoose_1 = __importDefault(require("mongoose"));
const favourites_services_1 = require("./favourites.services");
const favourites_model_1 = __importDefault(require("./favourites.model"));
const general_info_model_1 = __importDefault(require("../general_info/general_info.model"));
const likers_access_model_1 = __importStar(require("./likers_access.model"));
const notification_service_1 = require("../notifications/notification.service");
exports.FavoriteController = {
    getAllFavorites: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const favorites = yield favourites_services_1.FavoriteService.getAllFavorites();
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "All favorites retrieved successfully",
            data: favorites,
        });
    })),
    getMyFavouritesList: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const user = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!user) {
            return res.status(401).send({
                statusCode: 401,
                message: "You are not authorized",
                success: false,
            });
        }
        const user_mongo_id = new mongoose_1.default.Types.ObjectId(String(user));
        // Perform aggregation to fetch the required data
        const results = yield favourites_model_1.default.aggregate([
            { $match: { user: user_mongo_id, bio_user: { $ne: user_mongo_id } } },
            {
                $lookup: {
                    from: "addresses",
                    localField: "bio_user",
                    foreignField: "user",
                    as: "address",
                },
            },
            { $unwind: "$address" },
            {
                $lookup: {
                    from: "users",
                    localField: "bio_user",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$user" },
            {
                $lookup: {
                    from: "generalinfos",
                    localField: "bio_user",
                    foreignField: "user",
                    as: "general_info",
                },
            },
            { $unwind: "$general_info" },
            {
                $project: {
                    bio_id: "$user.user_id",
                    bio_user: "$address.user",
                    permanent_address: "$address.permanent_address",
                    date_of_birth: "$general_info.date_of_birth",
                    screen_color: "$general_info.screen_color",
                },
            },
        ]);
        res.status(201).json({
            success: true,
            message: "Favourites retrieved successfully",
            data: results,
        });
    })),
    getFavouritesListByUser: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        const bio_user = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
        // console.log("bio_user~~", bio_user);
        if (!bio_user) {
            return res.status(401).send({
                statusCode: 401,
                message: "You are not authorized",
                success: false,
            });
        }
        const user_mongo_bio_id = new mongoose_1.default.Types.ObjectId(String(bio_user));
        // TODO: paid feature; until unlocked only the count is sent, so the list can't be read from the API for free.
        const unlocked = yield likers_access_model_1.default.exists({ user: user_mongo_bio_id });
        if (!unlocked) {
            const count = yield favourites_model_1.default.countDocuments({ bio_user: user_mongo_bio_id, user: { $ne: user_mongo_bio_id } });
            return res.status(http_status_1.default.OK).json({
                success: true,
                locked: true,
                price: likers_access_model_1.LIKERS_VIEW_POINTS,
                count,
                data: [],
            });
        }
        // Perform aggregation to fetch the required data
        const results = yield favourites_model_1.default.aggregate([
            {
                $match: {
                    bio_user: user_mongo_bio_id,
                    user: { $ne: user_mongo_bio_id },
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
            { $unwind: "$address" },
            {
                $lookup: {
                    from: "generalinfos",
                    localField: "user",
                    foreignField: "user",
                    as: "general_info",
                },
            },
            { $unwind: "$general_info" },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$user" },
            {
                $project: {
                    bio_id: "$user.user_id",
                    bio_user: "$address.user",
                    permanent_address: "$address.permanent_address",
                    date_of_birth: "$general_info.date_of_birth",
                    screen_color: "$general_info.screen_color",
                },
            },
        ]);
        res.status(201).json({
            success: true,
            locked: false,
            price: likers_access_model_1.LIKERS_VIEW_POINTS,
            count: results.length,
            message: "Favourites retrieved successfully",
            data: results,
        });
    })),
    // TODO: one-time unlock of "who favourited my biodata"; points are taken atomically and only once.
    unlockLikers: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _c, _d, _e, _f;
        const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({ success: false, message: "You are not authorized" });
        }
        if (yield likers_access_model_1.default.exists({ user: userId })) {
            const user = yield user_info_model_1.UserInfoModel.findById(userId).select("points").lean();
            return res.status(http_status_1.default.OK).json({ success: true, alreadyUnlocked: true, points_balance: (_d = user === null || user === void 0 ? void 0 : user.points) !== null && _d !== void 0 ? _d : null });
        }
        const charged = yield user_info_model_1.UserInfoModel.findOneAndUpdate({ _id: userId, points: { $gte: likers_access_model_1.LIKERS_VIEW_POINTS } }, { $inc: { points: -likers_access_model_1.LIKERS_VIEW_POINTS } }, { new: true })
            .select("points")
            .lean();
        if (!charged) {
            const user = yield user_info_model_1.UserInfoModel.findById(userId).select("points").lean();
            return res.status(http_status_1.default.BAD_REQUEST).json({
                success: false,
                insufficient: true,
                price: likers_access_model_1.LIKERS_VIEW_POINTS,
                points_balance: (_e = user === null || user === void 0 ? void 0 : user.points) !== null && _e !== void 0 ? _e : 0,
                message: `এই তালিকা দেখতে ${likers_access_model_1.LIKERS_VIEW_POINTS} পয়েন্ট প্রয়োজন। আপনার অ্যাকাউন্টে পর্যাপ্ত পয়েন্ট নেই।`,
            });
        }
        try {
            yield likers_access_model_1.default.create({ user: userId, points_spent: likers_access_model_1.LIKERS_VIEW_POINTS });
        }
        catch (error) {
            // TODO: a parallel request unlocked it first; give these points back.
            const refunded = yield user_info_model_1.UserInfoModel.findByIdAndUpdate(userId, { $inc: { points: likers_access_model_1.LIKERS_VIEW_POINTS } }, { new: true })
                .select("points")
                .lean();
            if ((error === null || error === void 0 ? void 0 : error.code) === 11000) {
                return res.status(http_status_1.default.OK).json({ success: true, alreadyUnlocked: true, points_balance: (_f = refunded === null || refunded === void 0 ? void 0 : refunded.points) !== null && _f !== void 0 ? _f : null });
            }
            throw error;
        }
        notification_service_1.NotificationService.notify({
            recipient: String(userId),
            audience: "user",
            type: "payment",
            title: "পছন্দকারীদের তালিকা আনলক হয়েছে",
            message: `${likers_access_model_1.LIKERS_VIEW_POINTS} পয়েন্ট খরচ হয়েছে। এখন থেকে কারা আপনার বায়োডাটা পছন্দের তালিকায় রেখেছেন তা দেখতে পারবেন।`,
            link: "/user/account/likes",
        });
        res.status(http_status_1.default.OK).json({ success: true, alreadyUnlocked: false, points_balance: charged.points });
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
        var _g;
        const userId = (_g = req.user) === null || _g === void 0 ? void 0 : _g._id;
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
        var _h;
        const MAX_RETRIES = 3; // Maximum number of retries for transient errors
        const { bio_user } = req.body;
        const user = (_h = req.user) === null || _h === void 0 ? void 0 : _h._id;
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
        var _j;
        const id = (_j = req.user) === null || _j === void 0 ? void 0 : _j._id;
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
        var _k, _l;
        const user = (_k = req.user) === null || _k === void 0 ? void 0 : _k._id;
        const bio_user = (_l = req.params) === null || _l === void 0 ? void 0 : _l.id;
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
