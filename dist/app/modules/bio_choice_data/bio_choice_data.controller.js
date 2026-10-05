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
const bibahoMail_1 = require("../../../shared/bibahoMail");
const notification_service_1 = require("../notifications/notification.service");
const user_info_services_1 = require("../user_info/user_info.services");
exports.BioChoiceController = {
    getAllBioChoices: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const bioChoices = yield bio_choice_data_services_1.BioChoiceService.getAllBioChoices();
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "All bioChoices retrieved successfully",
            data: bioChoices,
        });
    })),
    getBioChoicesByAdmin: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { status = "pending", page = 1, limit = 10 } = req.query;
        const matchStage = status ? { status } : {};
        const skip = (Number(page) - 1) * Number(limit);
        const limitNum = Number(limit);
        const bioChoices = yield bio_choice_data_model_1.default.aggregate([
            {
                $lookup: {
                    from: "contacts",
                    localField: "user",
                    foreignField: "user",
                    as: "userContact",
                },
            },
            {
                $lookup: {
                    from: "contacts",
                    localField: "bio_user",
                    foreignField: "user",
                    as: "bioUserContact",
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userDetails",
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "bio_user",
                    foreignField: "_id",
                    as: "bioUserDetails",
                },
            },
            {
                $unwind: "$userContact",
            },
            {
                $unwind: "$bioUserContact",
            },
            {
                $unwind: "$bioUserDetails",
            },
            {
                $unwind: "$userDetails",
            },
            {
                $match: matchStage,
            },
            {
                $project: {
                    _id: 1,
                    user: 1,
                    bio_user: 1,
                    bio_details: 1,
                    feedback: 1,
                    bio_input: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    userContact: {
                        _id: 1,
                        full_name: 1,
                        family_number: 1,
                        relation: 1,
                        bio_receiving_email: 1,
                    },
                    bioUserContact: {
                        _id: 1,
                        full_name: 1,
                        family_number: 1,
                        relation: 1,
                        bio_receiving_email: 1,
                    },
                    userDetails: {
                        user_id: 1,
                        user_status: 1,
                        email: 1,
                        points: 1,
                    },
                    bioUserDetails: {
                        user_id: 1,
                        user_status: 1,
                        email: 1,
                        points: 1,
                    },
                },
            },
            {
                $sort: {
                    createdAt: -1, // Sort by `createdAt` in descending order
                },
            },
            {
                $skip: skip, // Skip the number of documents for pagination
            },
            {
                $limit: limitNum, // Limit the number of documents returned
            },
        ]);
        const totalCount = yield bio_choice_data_model_1.default.countDocuments(matchStage); // Count total documents after filtering
        res.status(200).json({
            totalPages: Math.ceil(totalCount / limitNum),
            currentPage: Number(page),
            size: totalCount,
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
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const mongo_user_id = new mongoose_1.default.Types.ObjectId(String(user_id));
        const results = yield bio_choice_data_model_1.default.aggregate([
            {
                $match: {
                    user: mongo_user_id,
                    bio_user: { $ne: mongo_user_id },
                },
            },
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
                    as: "user",
                },
            },
            { $unwind: "$user" },
            {
                $lookup: {
                    from: "contactpurchases",
                    let: { bio_id: "$bio_user" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$bio_user", "$$bio_id"] },
                                user: mongo_user_id,
                            },
                        },
                    ],
                    as: "contact_purchase",
                },
            },
            { $match: { contact_purchase: { $eq: [] } } },
            {
                $group: {
                    _id: "$bio_user",
                    permanent_area: { $first: "$address.permanent_area" },
                    present_area: { $first: "$address.present_area" },
                    zilla: { $first: "$address.zilla" },
                    bio_id: { $first: "$user.user_id" },
                    upzilla: { $first: "$address.upzilla" },
                    division: { $first: "$address.division" },
                    city: { $first: "$address.city" },
                    status: { $first: "$status" },
                    feedback: { $first: "$feedback" },
                    bio_details: { $first: "$bio_details" },
                },
            },
            {
                $project: {
                    _id: 0,
                    bio_user: "$_id",
                    bio_id: 1,
                    permanent_area: 1,
                    present_area: 1,
                    zilla: 1,
                    upzilla: 1,
                    division: 1,
                    city: 1,
                    status: 1,
                    feedback: 1,
                    bio_details: 1,
                },
            },
        ]).exec();
        res.status(201).json({
            success: true,
            message: "Bio Choice first step data retrieved successfully",
            data: results,
        });
    })),
    getBioChoiceDataOfSecondStep: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        const user_id = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
        const mongo_user_id = new mongoose_1.default.Types.ObjectId(String(user_id));
        const results = yield contact_purchase_data_model_1.default.aggregate([
            {
                $match: {
                    user: mongo_user_id,
                    bio_user: { $ne: mongo_user_id },
                },
            },
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
                    from: "generalinfos",
                    localField: "bio_user",
                    foreignField: "user",
                    as: "generalinfo",
                },
            },
            { $unwind: { path: "$generalinfo", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "contacts",
                    localField: "bio_user",
                    foreignField: "user",
                    as: "contact",
                },
            },
            { $unwind: "$contact" },
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
                $group: {
                    _id: "$bio_user",
                    permanent_area: { $first: "$address.permanent_area" },
                    present_area: { $first: "$address.present_area" },
                    zilla: { $first: "$address.zilla" },
                    bio_id: { $first: "$user.user_id" },
                    upzilla: { $first: "$address.upzilla" },
                    division: { $first: "$address.division" },
                    full_name: { $first: "$contact.full_name" },
                    family_number: { $first: "$contact.family_number" },
                    relation: { $first: "$contact.relation" },
                    bio_receiving_email: { $first: "$contact.bio_receiving_email" },
                    date_of_birth: { $first: "$generalinfo.date_of_birth" },
                    city: { $first: "$address.city" },
                    status: { $first: "$status" },
                    feedback: { $first: "$feedback" },
                    bio_details: { $first: "$bio_details" },
                },
            },
            {
                $project: {
                    _id: 0,
                    bio_user: "$_id",
                    bio_id: 1,
                    permanent_area: 1,
                    present_area: 1,
                    zilla: 1,
                    upzilla: 1,
                    division: 1,
                    city: 1,
                    status: 1,
                    feedback: 1,
                    bio_details: 1,
                    full_name: 1,
                    family_number: 1,
                    relation: 1,
                    bio_receiving_email: 1,
                    date_of_birth: 1,
                },
            },
        ]).exec();
        res.status(201).json({
            success: true,
            message: "Bio Choice first step data retrieved successfully",
            data: results,
        });
    })),
    getBioChoiceStatisticsData: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _c;
        const bio_user = (_c = req.params) === null || _c === void 0 ? void 0 : _c.bio_user;
        const mongoBioId = new mongoose_1.default.Types.ObjectId(bio_user);
        const results = yield bio_choice_data_model_1.default.aggregate([
            { $match: { bio_user: mongoBioId } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
            {
                $group: {
                    _id: null,
                    totalCount: { $sum: "$count" },
                    counts: { $push: { status: "$_id", count: "$count" } },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalCount: 1,
                    counts: {
                        $arrayToObject: {
                            $map: {
                                input: "$counts",
                                as: "item",
                                in: {
                                    k: "$$item.status",
                                    v: "$$item.count",
                                },
                            },
                        },
                    },
                },
            },
        ]);
        // console.log("results~~", results);
        const data = results[0] || { totalCount: 0, counts: {} };
        const totalCount = data.totalCount;
        const { rejected = 0, approved = 0, pending = 0 } = data.counts;
        if (totalCount === 0) {
            return res.status(200).json({
                success: true,
                results: {
                    rejected: 0,
                    approved: 0,
                    pending: 0,
                    rejectedPercentage: 0,
                    approvedPercentage: 0,
                    pendingPercentage: 0,
                },
                message: "No data found for the given bio_id",
            });
        }
        const responseResults = {
            rejected: rejected,
            approved: approved,
            pending: pending,
            rejectedPercentage: ((rejected / totalCount) * 100).toFixed(2),
            approvedPercentage: ((approved / totalCount) * 100).toFixed(2),
            pendingPercentage: ((pending / totalCount) * 100).toFixed(2),
        };
        res.status(200).json({
            success: true,
            results: responseResults,
            message: "All statistics retrieved successfully",
        });
    })),
    getBioChoiceByToken: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _d;
        const userId = (_d = req.user) === null || _d === void 0 ? void 0 : _d._id;
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
        var _e;
        const bio_user = (_e = req.user) === null || _e === void 0 ? void 0 : _e._id;
        if (!bio_user) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const mongoId = new mongoose_1.default.Types.ObjectId(String(bio_user));
        // const bioChoices = await BioChoice.find({
        //   bio_user: mongoId,
        // });
        // console.log("bioChoices", bioChoices);
        // const data: any = await BioChoice.aggregate([
        //   { $match: { bio_user: mongoId } },
        //   {
        //     $lookup: {
        //       from: "generalinfos",
        //       localField: "user",
        //       foreignField: "user",
        //       as: "general_info",
        //     },
        //   },
        //   { $unwind: "$general_info" },
        //   {
        //     $lookup: {
        //       from: "addresses",
        //       localField: "user",
        //       foreignField: "user",
        //       as: "address",
        //     },
        //   },
        //   {
        //     $unwind: {
        //       path: "$address",
        //       preserveNullAndEmptyArrays: true, // Allows address to be null
        //     },
        //   },
        //   {
        //     $lookup: {
        //       from: "users",
        //       localField: "user",
        //       foreignField: "_id",
        //       as: "users",
        //     },
        //   },
        //   {
        //     $unwind: {
        //       path: "$users",
        //       preserveNullAndEmptyArrays: true, // Also allow users to be null
        //     },
        //   },
        //   {
        //     $project: {
        //       user_id: "$users.user_id",
        //       user: "$users._id",
        //       date_of_birth: "$general_info.date_of_birth",
        //       status: 1,
        //       feedback: 1,
        //       bio_details: 1,
        //       present_address: { $ifNull: ["$address.present_address", null] },
        //       city: { $ifNull: ["$address.city", null] },
        //       present_area: { $ifNull: ["$address.present_area", null] },
        //     },
        //   },
        // ]);
        // res.json(sendSuccess("Retrieve bio share successfully", data, 200));
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
            {
                $lookup: {
                    from: "addresses",
                    localField: "user",
                    foreignField: "user",
                    as: "address",
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "users",
                },
            },
            {
                $project: {
                    user_id: { $arrayElemAt: ["$users.user_id", 0] },
                    user: { $arrayElemAt: ["$users._id", 0] },
                    date_of_birth: { $arrayElemAt: ["$general_info.date_of_birth", 0] },
                    status: 1,
                    feedback: 1,
                    bio_details: 1,
                    present_address: { $arrayElemAt: ["$address.present_address", 0] },
                    city: { $arrayElemAt: ["$address.city", 0] },
                    present_area: { $arrayElemAt: ["$address.present_area", 0] },
                },
            },
        ]);
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
        var _f;
        const data = req.body;
        const user = (_f = req.user) === null || _f === void 0 ? void 0 : _f._id;
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
            // TODO: only the owner decides; a new proposal always starts pending, whatever the client sends.
            data.status = "pending";
            delete data.feedback;
            // Fetch user info and check points
            const userInfo = yield user_info_model_1.UserInfoModel.findById(user).session(session);
            const bioUserInfo = yield user_info_model_1.UserInfoModel.findById(data.bio_user).session(session);
            if (!userInfo || userInfo.points < 30) {
                yield session.abortTransaction();
                return res.status(http_status_1.default.FORBIDDEN).json({
                    success: false,
                    message: "You have less than 30 points",
                });
            }
            if (!bioUserInfo) {
                yield session.abortTransaction();
                return res.status(http_status_1.default.FORBIDDEN).json({
                    success: false,
                    message: "Bio user not found",
                });
            }
            // Deduct points and save user info
            const points = userInfo.points - 30;
            userInfo.points = points;
            yield userInfo.save({ session });
            // Create the BioChoice
            const response = yield bio_choice_data_services_1.BioChoiceService.createBioChoice(data, {
                session,
            });
            // Commit the transaction
            yield session.commitTransaction();
            // TODO: emails go out only after the request is saved, and never delay the response.
            (0, bibahoMail_1.mailUser)(userInfo.email, "আপনার প্রস্তাব পাঠানো হয়েছে", {
                title: "আপনার প্রস্তাব সফলভাবে পাঠানো হয়েছে",
                tone: "success",
                paragraphs: [
                    "আপনার বায়োডাটা ও প্রস্তাব পাত্র/পাত্রীর কাছে পাঠানো হয়েছে। তিনি সাড়া দিলে আপনাকে ইমেইল ও নোটিফিকেশনে জানানো হবে।",
                ],
                details: [
                    { label: "বায়োডাটা নং", value: bioUserInfo.user_id },
                    { label: "খরচ হওয়া পয়েন্ট", value: 30 },
                    { label: "অবশিষ্ট পয়েন্ট", value: points },
                ],
                action: { label: "আমার অনুরোধগুলো দেখুন", path: "/user/account/purchases" },
            });
            (0, bibahoMail_1.mailUser)(bioUserInfo.email, "আপনি একটি নতুন প্রস্তাব পেয়েছেন", {
                title: "আপনি একটি নতুন প্রস্তাব পেয়েছেন",
                paragraphs: [
                    "একজন সদস্য আপনার বায়োডাটা দেখে আগ্রহ প্রকাশ করেছেন এবং তার বায়োডাটা আপনার কাছে পাঠিয়েছেন।",
                    "বায়োডাটাটি দেখে প্রস্তাবটি গ্রহণ বা প্রত্যাখ্যান করুন।",
                ],
                details: [{ label: "প্রস্তাবকারীর বায়োডাটা নং", value: userInfo.user_id }],
                action: { label: "প্রস্তাবটি দেখুন", path: "/user/account/bio-requests" },
            });
            notification_service_1.NotificationService.notify({
                recipient: String(bioUserInfo._id),
                audience: "user",
                type: "biodata",
                title: "নতুন প্রস্তাব",
                message: `বায়োডাটা নং ${userInfo.user_id} আপনার কাছে তার বায়োডাটা ও প্রস্তাব পাঠিয়েছেন।`,
                link: "/user/account/bio-requests",
            });
            notification_service_1.NotificationService.notify({
                audience: "admin",
                type: "biodata",
                title: "নতুন প্রস্তাব পাঠানো হয়েছে",
                message: `বায়োডাটা নং ${userInfo.user_id} → বায়োডাটা নং ${bioUserInfo.user_id} (৩০ পয়েন্ট)।`,
                link: "/contact-requests",
            });
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
    checkBioChoiceDataOfFirstStep: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _g;
        const user = (_g = req.user) === null || _g === void 0 ? void 0 : _g._id;
        const bio_user = req.params.id;
        if (!user) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const checkBioChoice = yield bio_choice_data_services_1.BioChoiceService.checkBioChoiceDataOfFirstStep({
            bio_user,
            user,
        });
        // TODO: "no proposal yet" is a normal answer, not an error.
        if (!checkBioChoice) {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "No proposal sent to this biodata yet",
                data: null,
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "Check BioChoice first step successfully",
                data: {
                    status: checkBioChoice === null || checkBioChoice === void 0 ? void 0 : checkBioChoice.status,
                },
            });
        }
    })),
    checkBioChoiceDataOfSecondStep: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _h;
        const user = (_h = req.user) === null || _h === void 0 ? void 0 : _h._id;
        const bio_user = req.params.id;
        if (!user) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        // Use aggregation with lookup to get contact info
        if (!mongoose_1.default.isValidObjectId(bio_user)) {
            return res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: "Invalid biodata id" });
        }
        const checkBioChoice = yield contact_purchase_data_model_1.default.aggregate([
            {
                $match: {
                    user: new mongoose_1.default.Types.ObjectId(String(user)),
                    bio_user: new mongoose_1.default.Types.ObjectId(bio_user),
                },
            },
            {
                $lookup: {
                    from: "contacts",
                    localField: "bio_user",
                    foreignField: "user",
                    as: "contact_info",
                },
            },
            {
                $unwind: {
                    path: "$contact_info",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 1,
                    user: 1,
                    bio_user: 1,
                    "contact_info.bio_receiving_email": 1,
                    "contact_info.relation": 1,
                    "contact_info.family_number": 1,
                    "contact_info.full_name": 1,
                },
            },
        ]);
        // TODO: "contact not bought yet" is a normal answer, not an error.
        if (!checkBioChoice.length) {
            return res.status(http_status_1.default.OK).json({
                success: true,
                message: "Contact info not purchased yet",
                data: null,
            });
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Check BioChoice second step successfully",
            data: checkBioChoice[0],
        });
    })),
    updateBioChoice: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _j;
        const bio_user = (_j = req.user) === null || _j === void 0 ? void 0 : _j._id;
        const { type } = req.query;
        const _k = req.body, { user } = _k, others = __rest(_k, ["user"]);
        // TODO: "approved" is the one accepted status; step 2 only checks for it.
        if (others.status === "accepted")
            others.status = "approved";
        if (!bio_user) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const updatedBioChoice = yield bio_choice_data_services_1.BioChoiceService.updateBioChoice({ bio_user, user }, others);
        if (!updatedBioChoice) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "BioChoice not found",
            });
        }
        const bioUser = yield user_info_services_1.UserInfoService.getUserInfoById(bio_user);
        const userData = yield user_info_services_1.UserInfoService.getUserInfoById(user);
        const status = others === null || others === void 0 ? void 0 : others.status;
        const accepted = status === "approved";
        // TODO: both sides get an email: the requester learns the answer, the responder gets a confirmation.
        if (type === "feedback") {
            notification_service_1.NotificationService.notify({
                recipient: String(user),
                audience: "user",
                type: "biodata",
                title: "প্রস্তাবে মতামত এসেছে",
                message: `বায়োডাটা নং ${bioUser === null || bioUser === void 0 ? void 0 : bioUser.user_id} আপনার প্রস্তাবে একটি মতামত দিয়েছেন।`,
                link: "/user/account/purchases",
            });
            (0, bibahoMail_1.mailUser)(userData === null || userData === void 0 ? void 0 : userData.email, "আপনি একটি মতামত পেয়েছেন", {
                title: "আপনার প্রস্তাবে মতামত এসেছে",
                paragraphs: ["আপনি যে বায়োডাটায় প্রস্তাব পাঠিয়েছিলেন, তার পক্ষ থেকে একটি মতামত এসেছে।"],
                details: [
                    { label: "বায়োডাটা নং", value: bioUser === null || bioUser === void 0 ? void 0 : bioUser.user_id },
                    { label: "মতামত", value: others === null || others === void 0 ? void 0 : others.feedback },
                ],
                action: { label: "বিস্তারিত দেখুন", path: "/user/account/purchases" },
            });
            (0, bibahoMail_1.mailUser)(bioUser === null || bioUser === void 0 ? void 0 : bioUser.email, "আপনার মতামত পাঠানো হয়েছে", {
                title: "আপনার মতামত পাঠানো হয়েছে",
                paragraphs: ["আপনার মতামত প্রস্তাবকারীর কাছে পৌঁছে দেওয়া হয়েছে।"],
                details: [{ label: "প্রস্তাবকারীর বায়োডাটা নং", value: userData === null || userData === void 0 ? void 0 : userData.user_id }],
                action: { label: "অনুরোধগুলো দেখুন", path: "/user/account/bio-requests" },
            });
        }
        else if (accepted || status === "rejected") {
            notification_service_1.NotificationService.notify({
                recipient: String(user),
                audience: "user",
                type: "biodata",
                title: accepted ? "প্রস্তাব গৃহীত হয়েছে" : "প্রস্তাব প্রত্যাখ্যাত হয়েছে",
                message: accepted
                    ? `বায়োডাটা নং ${bioUser === null || bioUser === void 0 ? void 0 : bioUser.user_id} আপনার প্রস্তাব গ্রহণ করেছেন। এখন অভিভাবকের যোগাযোগ তথ্য নিতে পারবেন।`
                    : `বায়োডাটা নং ${bioUser === null || bioUser === void 0 ? void 0 : bioUser.user_id} এই মুহূর্তে আপনার প্রস্তাবে আগ্রহী নন।`,
                link: accepted ? "/user/account/purchases" : "/biodatas",
            });
            notification_service_1.NotificationService.notify({
                audience: "admin",
                type: "biodata",
                title: accepted ? "প্রস্তাব গৃহীত" : "প্রস্তাব প্রত্যাখ্যাত",
                message: `বায়োডাটা নং ${bioUser === null || bioUser === void 0 ? void 0 : bioUser.user_id} ${accepted ? "গ্রহণ করেছেন" : "প্রত্যাখ্যান করেছেন"} বায়োডাটা নং ${userData === null || userData === void 0 ? void 0 : userData.user_id}-এর প্রস্তাব।`,
                link: "/contact-requests",
            });
            (0, bibahoMail_1.mailUser)(userData === null || userData === void 0 ? void 0 : userData.email, accepted ? "আপনার প্রস্তাব গৃহীত হয়েছে" : "আপনার প্রস্তাব প্রত্যাখ্যাত হয়েছে", {
                title: accepted ? "অভিনন্দন! আপনার প্রস্তাব গৃহীত হয়েছে" : "আপনার প্রস্তাব প্রত্যাখ্যাত হয়েছে",
                tone: accepted ? "success" : "warning",
                paragraphs: [
                    accepted
                        ? "আপনি যে বায়োডাটায় প্রস্তাব পাঠিয়েছিলেন, তিনি আপনার প্রস্তাবে সম্মতি দিয়েছেন। এখন পরবর্তী ধাপে অভিভাবকের যোগাযোগ তথ্য নিতে পারবেন।"
                        : "দুঃখিত, আপনি যে বায়োডাটায় প্রস্তাব পাঠিয়েছিলেন, তিনি এই মুহূর্তে আগ্রহী নন। আরও বায়োডাটা দেখে নতুন প্রস্তাব পাঠাতে পারেন।",
                ],
                details: [{ label: "বায়োডাটা নং", value: bioUser === null || bioUser === void 0 ? void 0 : bioUser.user_id }],
                action: accepted
                    ? { label: "পরবর্তী ধাপে যান", path: "/user/account/purchases" }
                    : { label: "আরও বায়োডাটা দেখুন", path: "/biodatas" },
            });
            (0, bibahoMail_1.mailUser)(bioUser === null || bioUser === void 0 ? void 0 : bioUser.email, accepted ? "আপনি একটি প্রস্তাব গ্রহণ করেছেন" : "আপনি একটি প্রস্তাব প্রত্যাখ্যান করেছেন", {
                title: accepted ? "আপনি প্রস্তাবটি গ্রহণ করেছেন" : "আপনি প্রস্তাবটি প্রত্যাখ্যান করেছেন",
                paragraphs: [
                    accepted
                        ? "আপনার সম্মতি প্রস্তাবকারীকে জানানো হয়েছে। তিনি পরবর্তী ধাপে আপনার অভিভাবকের যোগাযোগ তথ্য নিতে পারবেন।"
                        : "আপনার সিদ্ধান্ত প্রস্তাবকারীকে জানানো হয়েছে।",
                ],
                details: [{ label: "প্রস্তাবকারীর বায়োডাটা নং", value: userData === null || userData === void 0 ? void 0 : userData.user_id }],
                action: { label: "অনুরোধগুলো দেখুন", path: "/user/account/bio-requests" },
            });
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "BioChoice updated successfully",
            data: updatedBioChoice,
        });
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
