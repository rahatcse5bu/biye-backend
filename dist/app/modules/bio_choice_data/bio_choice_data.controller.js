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
exports.BioChoiceController = void 0;
const SendSuccess_1 = require("./../../../shared/SendSuccess");
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const user_info_model_1 = require("../user_info/user_info.model");
const mongoose_1 = __importDefault(require("mongoose"));
const bio_choice_data_services_1 = require("./bio_choice_data.services");
const bio_choice_data_model_1 = __importDefault(require("./bio_choice_data.model"));
const contact_purchase_data_model_1 = __importDefault(require("../contact_purchase_data/contact_purchase_data.model"));
exports.BioChoiceController = {
    getAllBioChoices: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const bioChoices = yield bio_choice_data_services_1.BioChoiceService.getAllBioChoices();
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "All bioChoices retrieved successfully",
            data: bioChoices,
        });
    })),
    getBioChoiceById: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const id = req.params.id;
        const bioChoice = yield bio_choice_data_services_1.BioChoiceService.getBioChoiceById(id);
        if (!bioChoice) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "BioChoice not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "BioChoice retrieved successfully",
                data: bioChoice,
            });
        }
    })),
    getBioChoiceDataOfFirstStep: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const user = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!user) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                success: false,
                message: "You are not authorized",
            });
        }
        const mongoUserId = new mongoose_1.default.Types.ObjectId(user);
        const mongoBioUserId = new mongoose_1.default.Types.ObjectId(user);
        // const data = await BioChoice.aggregate([
        //   {
        //     $match: {
        //       user: mongoUserId,
        //     },
        //   },
        //   {
        //     $lookup: {
        //       from: "addresses",
        //       localField: "bio_user",
        //       foreignField: "user",
        //       as: "address",
        //     },
        //   },
        //   { $unwind: "$address" },
        //   {
        //     $lookup: {
        //       from: "biochoices",
        //       localField: "bio_user",
        //       foreignField: "user",
        //       as: "main",
        //     },
        //   },
        //   {
        //     $unwind: { path: "$main", preserveNullAndEmptyArrays: true },
        //   },
        //   {
        //     $match: {
        //       bio_user: {
        //         $nin: await ContactPurchase.find(
        //           { user: mongoUserId },
        //           "bio_user"
        //         ).distinct("bio_user"),
        //       },
        //     },
        //   },
        //   {
        //     $group: {
        //       _id: "$bio_user",
        //       bio_user: { $first: "$bio_user" },
        //       permanent_area: { $first: "$address.permanent_area" },
        //       present_area: { $first: "$address.present_area" },
        //       zilla: { $first: "$address.zilla" },
        //       upzilla: { $first: "$address.upzilla" },
        //       division: { $first: "$address.division" },
        //       city: { $first: "$address.city" },
        //       status: { $first: "$status" },
        //       feedback: { $first: "$feedback" },
        //       bio_details: { $first: "$bio_details" },
        //       total_count: { $sum: 1 },
        //       approval_count: {
        //         $sum: {
        //           $cond: [{ $eq: ["$main.status", "approved"] }, 1, 0],
        //         },
        //       },
        //       rejection_count: {
        //         $sum: {
        //           $cond: [{ $eq: ["$main.status", "rejected"] }, 1, 0],
        //         },
        //       },
        //       pending_count: {
        //         $sum: {
        //           $cond: [{ $eq: ["$main.status", "pending"] }, 1, 0],
        //         },
        //       },
        //     },
        //   },
        //   {
        //     $project: {
        //       bio_user: 1,
        //       permanent_area: 1,
        //       present_area: 1,
        //       zilla: 1,
        //       upzilla: 1,
        //       division: 1,
        //       city: 1,
        //       status: 1,
        //       feedback: 1,
        //       bio_details: 1,
        //       total_count: 1,
        //       approval_count: 1,
        //       rejection_count: 1,
        //       pending_count: 1,
        //       approval_rate: {
        //         $cond: {
        //           if: {
        //             $eq: [{ $subtract: ["$total_count", "$pending_count"] }, 0],
        //           },
        //           then: 0.0,
        //           else: {
        //             $multiply: [
        //               {
        //                 $divide: [
        //                   "$approval_count",
        //                   { $subtract: ["$total_count", "$pending_count"] },
        //                 ],
        //               },
        //               100.0,
        //             ],
        //           },
        //         },
        //       },
        //       rejection_rate: {
        //         $cond: {
        //           if: {
        //             $eq: [{ $subtract: ["$total_count", "$pending_count"] }, 0],
        //           },
        //           then: 0.0,
        //           else: {
        //             $multiply: [
        //               {
        //                 $divide: [
        //                   "$rejection_count",
        //                   { $subtract: ["$total_count", "$pending_count"] },
        //                 ],
        //               },
        //               100.0,
        //             ],
        //           },
        //         },
        //       },
        //     },
        //   },
        // ]);
        const data = yield bio_choice_data_model_1.default.aggregate([
            {
                $match: {
                    user: user,
                },
            },
            {
                $group: {
                    _id: "$bio_user",
                    status: { $first: "$status" },
                    feedback: { $first: "$feedback" },
                    bio_details: { $first: "$bio_details" },
                    total_count: { $sum: 1 },
                    approval_count: {
                        $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] },
                    },
                    rejection_count: {
                        $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] },
                    },
                    pending_count: {
                        $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
                    },
                },
            },
            {
                $lookup: {
                    from: "address",
                    localField: "_id",
                    foreignField: "user",
                    as: "address",
                },
            },
            {
                $unwind: "$address",
            },
            {
                $match: {
                    "address.user": {
                        $nin: yield contact_purchase_data_model_1.default.distinct("bio_user", {
                            user: user,
                        }),
                    },
                },
            },
            {
                $project: {
                    bio_id: "$_id",
                    permanent_area: "$address.permanent_area",
                    present_area: "$address.present_area",
                    zilla: "$address.zilla",
                    upzilla: "$address.upzilla",
                    division: "$address.division",
                    city: "$address.city",
                    status: 1,
                    feedback: 1,
                    bio_details: 1,
                    total_count: 1,
                    approval_count: 1,
                    rejection_count: 1,
                    pending_count: 1,
                    approval_rate: {
                        $cond: [
                            { $eq: ["$total_count", "$pending_count"] },
                            0,
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            { $multiply: ["$approval_count", 100] },
                                            { $subtract: ["$total_count", "$pending_count"] },
                                        ],
                                    },
                                    1.0,
                                ],
                            },
                        ],
                    },
                    rejection_rate: {
                        $cond: [
                            { $eq: ["$total_count", "$pending_count"] },
                            0,
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            { $multiply: ["$rejection_count", 100] },
                                            { $subtract: ["$total_count", "$pending_count"] },
                                        ],
                                    },
                                    1.0,
                                ],
                            },
                        ],
                    },
                },
            },
        ]).exec();
        res.json((0, SendSuccess_1.sendSuccess)("Retrieve first bio", data, 200));
    })),
    getBioChoiceByToken: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const bioChoice = yield bio_choice_data_services_1.BioChoiceService.getBioChoiceByToken(userId);
        if (!bioChoice) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "BioChoice not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "BioChoice retrieved successfully",
                data: bioChoice,
            });
        }
    })),
    getBioChoiceDataOfShare: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _c;
        const bio_user = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id;
        console.log("bio_user~~", bio_user);
        if (!bio_user) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const mongoId = new mongoose_1.default.Types.ObjectId(bio_user);
        const data = yield bio_choice_data_model_1.default.aggregate([
            { $match: { bio_user: mongoId } },
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
                    from: "addresses",
                    localField: "user",
                    foreignField: "user",
                    as: "address",
                },
            },
            { $unwind: "$address" },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "users",
                },
            },
            { $unwind: "$users" },
            {
                $project: {
                    user_id: "$users.user_id",
                    user: "$users._id",
                    date_of_birth: "$general_info.date_of_birth",
                    status: 1,
                    feedback: 1,
                    bio_details: 1,
                    present_address: "$address.present_address",
                    city: "$address.city",
                    present_area: "$address.present_area",
                },
            },
        ]);
        // const data = await BioChoice.findOne({
        //   bio_user,
        // });
        res.json((0, SendSuccess_1.sendSuccess)("Retrieve bio share successfully", data, 200));
    })),
    // createBioChoice: catchAsync(async (req: Request, res: Response) => {
    //   const data = req.body;
    //   const user = req.user?._id;
    //   // for un authorized check
    //   if (!user) {
    //     return res.status(httpStatus.UNAUTHORIZED).json({
    //       statusCode: httpStatus.UNAUTHORIZED,
    //       message: "You are not authorized",
    //       success: false,
    //     });
    //   }
    //   // check exists
    //   const bioChoice = await BioChoiceService.checkBioChoiceExist({
    //     user: user,
    //     bio_user: data.bio_user,
    //   });
    //   if (bioChoice) {
    //     return res.status(httpStatus.CONFLICT).json({
    //       success: false,
    //       message: "BioChoice already exists",
    //     });
    //   }
    //   data.user = user;
    //   const userInfo: any = await UserInfoModel.findOne({ user: user });
    //   if (userInfo.points < 30) {
    //     throw new ApiError(httpStatus.FORBIDDEN, "You have less than 30 points");
    //   }
    //   userInfo.points = userInfo.points - 30;
    //   await userInfo.save();
    //   const response = await BioChoiceService.createBioChoice(data);
    //   res.json({
    //     success: true,
    //     message: "BioChoice created successfully",
    //     data: response,
    //   });
    // }),
    createBioChoice: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _d;
        const data = req.body;
        const user = (_d = req.user) === null || _d === void 0 ? void 0 : _d._id;
        // for unauthorized check
        if (!user) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        // Start a session and transaction
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            // Check if the BioChoice already exists
            const bioChoice = yield bio_choice_data_services_1.BioChoiceService.checkBioChoiceExist({
                user: user,
                bio_user: data.bio_user,
            });
            if (bioChoice) {
                yield session.abortTransaction();
                return res.status(http_status_1.default.CONFLICT).json({
                    success: false,
                    message: "BioChoice already exists",
                });
            }
            data.user = user;
            // Fetch user info and check points
            const userInfo = yield user_info_model_1.UserInfoModel.findById(user).session(session);
            if (!userInfo || userInfo.points < 30) {
                yield session.abortTransaction();
                return res.status(http_status_1.default.FORBIDDEN).json({
                    success: false,
                    message: "You have less than 30 points",
                });
            }
            // Deduct points and save user info
            userInfo.points -= 30;
            yield userInfo.save({ session });
            // Create the BioChoice
            const response = yield bio_choice_data_services_1.BioChoiceService.createBioChoice(data, {
                session,
            });
            // Commit the transaction
            yield session.commitTransaction();
            return res.json({
                success: true,
                message: "BioChoice created successfully",
                data: response,
            });
        }
        catch (error) {
            try {
                yield session.abortTransaction();
            }
            catch (abortError) {
                console.error("Error aborting transaction:", abortError);
            }
            console.error("Error creating BioChoice:", error);
            return res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Internal server error",
            });
        }
        finally {
            session.endSession();
        }
    })),
    updateBioChoice: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _e;
        const bio_user = (_e = req.user) === null || _e === void 0 ? void 0 : _e._id;
        const _f = req.body, { user } = _f, others = __rest(_f, ["user"]);
        if (!bio_user) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const updatedBioChoice = yield bio_choice_data_services_1.BioChoiceService.updateBioChoice({ bio_user, user }, others);
        if (!updatedBioChoice) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "BioChoice not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "BioChoice updated successfully",
                data: updatedBioChoice,
            });
        }
    })),
    deleteBioChoice: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const id = req.params.id;
        yield bio_choice_data_services_1.BioChoiceService.deleteBioChoice(id);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "BioChoice deleted successfully",
        });
    })),
};
