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
exports.ContactPurchaseController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const user_info_model_1 = require("../user_info/user_info.model");
const mongoose_1 = __importDefault(require("mongoose"));
const contact_purchase_data_services_1 = require("./contact_purchase_data.services");
const bio_choice_data_model_1 = __importDefault(require("../bio_choice_data/bio_choice_data.model"));
const contact_model_1 = __importDefault(require("../contact/contact.model"));
const bibahoMail_1 = require("../../../shared/bibahoMail");
const notification_service_1 = require("../notifications/notification.service");
const contact_purchase_data_model_1 = __importDefault(require("./contact_purchase_data.model"));
exports.ContactPurchaseController = {
    getAllContactPurchases: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const contactPurchases = yield contact_purchase_data_services_1.ContactPurchaseService.getAllContactPurchases();
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "All contact Purchases retrieved successfully",
            data: contactPurchases,
        });
    })),
    getAllContactPurchasesByAdmin: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { status, page = 1, limit = 10, search } = req.query;
        const matchStage = status ? { status } : {};
        const skip = (Number(page) - 1) * Number(limit);
        const limitNum = Number(limit);
        // Build search match stage if search query provided
        const searchMatchStage = search
            ? {
                $or: [
                    { "userDetails.email": { $regex: search, $options: "i" } },
                    { "bioUserDetails.email": { $regex: search, $options: "i" } },
                    { "userDetails.user_id": isNaN(Number(search)) ? undefined : Number(search) },
                    { "bioUserDetails.user_id": isNaN(Number(search)) ? undefined : Number(search) },
                ].filter((condition) => {
                    const values = Object.values(condition);
                    return values.every((v) => v !== undefined);
                }),
            }
            : null;
        const contactPurchases = yield contact_purchase_data_model_1.default.aggregate([
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
            ...(searchMatchStage ? [{ $match: searchMatchStage }] : []),
            {
                $project: {
                    _id: 1,
                    user: 1,
                    bio_user: 1,
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
        // Build count pipeline (same filters as data pipeline but without skip/limit)
        const countPipeline = [
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
            { $unwind: "$userContact" },
            { $unwind: "$bioUserContact" },
            { $unwind: "$bioUserDetails" },
            { $unwind: "$userDetails" },
            { $match: matchStage },
            ...(searchMatchStage ? [{ $match: searchMatchStage }] : []),
            { $count: "total" },
        ];
        const countResult = yield contact_purchase_data_model_1.default.aggregate(countPipeline);
        const totalCount = countResult.length > 0 ? countResult[0].total : 0;
        res.status(200).json({
            totalPages: Math.ceil(totalCount / limitNum),
            currentPage: Number(page),
            totalItems: totalCount,
            data: contactPurchases,
        });
    })),
    getContactPurchaseById: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const id = req.params.id;
        const contactPurchase = yield contact_purchase_data_services_1.ContactPurchaseService.getContactPurchaseById(id);
        if (!contactPurchase) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "ContactPurchase not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "ContactPurchase retrieved successfully",
                data: contactPurchase,
            });
        }
    })),
    getContactPurchaseByToken: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const contactPurchase = yield contact_purchase_data_services_1.ContactPurchaseService.getContactPurchaseByToken(userId);
        if (!contactPurchase) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "ContactPurchase not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "ContactPurchase retrieved successfully",
                data: contactPurchase,
            });
        }
    })),
    createContactPurchase: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        const { bio_user } = req.body;
        if (!((_b = req === null || req === void 0 ? void 0 : req.user) === null || _b === void 0 ? void 0 : _b._id)) {
            throw new Error("You are not authorized");
        }
        if (!bio_user) {
            throw new Error("Invalid Data");
        }
        const user = req.user._id;
        // Start a session for the transaction
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            // Check points of user info model
            const userInfo = yield user_info_model_1.UserInfoModel.findById(user).session(session);
            const bioUser = yield user_info_model_1.UserInfoModel.findById(bio_user).session(session);
            if (!userInfo) {
                yield session.abortTransaction();
                session.endSession();
                return res.status(http_status_1.default.NOT_FOUND).json({
                    statusCode: http_status_1.default.NOT_FOUND,
                    message: "User info not found",
                    success: false,
                });
            }
            if (!bioUser) {
                yield session.abortTransaction();
                session.endSession();
                return res.status(http_status_1.default.NOT_FOUND).json({
                    statusCode: http_status_1.default.NOT_FOUND,
                    message: "Bio User not found",
                    success: false,
                });
            }
            // Check existing contact purchase with same user_id and bio_id
            const existingContactPurchase = yield contact_purchase_data_services_1.ContactPurchaseService.getContactPurchaseByUserAndBioUser(user, bio_user, { session });
            if (existingContactPurchase) {
                yield session.abortTransaction();
                session.endSession();
                return res.status(http_status_1.default.BAD_REQUEST).json({
                    statusCode: http_status_1.default.BAD_REQUEST,
                    message: "ContactPurchase already exists",
                    success: false,
                });
            }
            // Check bio choice data status
            const bioChoice = yield bio_choice_data_model_1.default.findOne({ bio_user, user }).session(session);
            if (!bioChoice || bioChoice.status !== "approved") {
                yield session.abortTransaction();
                session.endSession();
                return res.status(http_status_1.default.BAD_REQUEST).json({
                    statusCode: http_status_1.default.BAD_REQUEST,
                    message: "Invalid action",
                    success: false,
                });
            }
            if (userInfo.points < 70) {
                yield session.abortTransaction();
                session.endSession();
                return res.status(http_status_1.default.BAD_REQUEST).json({
                    statusCode: http_status_1.default.BAD_REQUEST,
                    message: "You do not have enough points to buy",
                    success: false,
                });
            }
            const contactPurchase = {
                user,
                bio_user,
            };
            // Create contactPurchase
            const createdContactPurchase = yield contact_purchase_data_services_1.ContactPurchaseService.createContactPurchase(contactPurchase, {
                session,
            });
            // Update user's points
            const points = userInfo.points - 70;
            userInfo.points = points;
            yield userInfo.save({ session });
            // user html
            const bioContact = yield contact_model_1.default.findOne({ user: bio_user }).session(session);
            if (!bioContact) {
                yield session.abortTransaction();
                session.endSession();
                return res.status(http_status_1.default.NOT_FOUND).json({
                    statusCode: http_status_1.default.NOT_FOUND,
                    message: "Bio Contact not found",
                    success: false,
                });
            }
            // Commit the transaction
            yield session.commitTransaction();
            session.endSession();
            // TODO: emails only after the purchase is saved; buyer gets the contact, owner gets a heads-up.
            (0, bibahoMail_1.mailUser)(userInfo.email, "অভিভাবকের যোগাযোগ তথ্য", {
                title: "আপনার কেনা যোগাযোগ তথ্য",
                tone: "success",
                paragraphs: [
                    "ধন্যবাদ! নিচে পাত্র/পাত্রীর অভিভাবকের যোগাযোগ তথ্য দেওয়া হলো। এই তথ্য আপনার অ্যাকাউন্টের \"ক্রয়কৃত\" অংশেও সবসময় দেখতে পাবেন।",
                    "অনুগ্রহ করে শালীনতা বজায় রেখে যোগাযোগ করুন।",
                ],
                details: [
                    { label: "বায়োডাটা নং", value: bioUser.user_id },
                    { label: "অভিভাবকের নাম", value: bioContact.full_name },
                    { label: "সম্পর্ক", value: bioContact.relation },
                    { label: "মোবাইল নম্বর", value: bioContact.family_number },
                    { label: "ইমেইল", value: bioContact.bio_receiving_email },
                    { label: "খরচ হওয়া পয়েন্ট", value: 70 },
                    { label: "অবশিষ্ট পয়েন্ট", value: points },
                ],
                action: { label: "ক্রয়কৃত বায়োডাটা দেখুন", path: "/user/account/purchases" },
            });
            (0, bibahoMail_1.mailUser)(bioUser.email, "আপনার অভিভাবকের যোগাযোগ তথ্য নেওয়া হয়েছে", {
                title: "একজন সদস্য আপনার অভিভাবকের যোগাযোগ তথ্য নিয়েছেন",
                paragraphs: [
                    "আপনার প্রস্তাবে সম্মতির পর একজন সদস্য আপনার অভিভাবকের যোগাযোগ তথ্য নিয়েছেন। শীঘ্রই তিনি আপনার অভিভাবকের সাথে যোগাযোগ করতে পারেন।",
                ],
                details: [{ label: "সদস্যের বায়োডাটা নং", value: userInfo.user_id }],
                action: { label: "ড্যাশবোর্ড দেখুন", path: "/user/account/dashboard" },
            });
            notification_service_1.NotificationService.notify({
                recipient: String(bioUser._id),
                audience: "user",
                type: "biodata",
                title: "যোগাযোগ তথ্য নেওয়া হয়েছে",
                message: `বায়োডাটা নং ${userInfo.user_id} আপনার অভিভাবকের যোগাযোগ তথ্য নিয়েছেন।`,
                link: "/user/account/bio-requests",
            });
            notification_service_1.NotificationService.notify({
                recipient: String(userInfo._id),
                audience: "user",
                type: "payment",
                title: "যোগাযোগ তথ্য কেনা সম্পন্ন",
                message: `বায়োডাটা নং ${bioUser.user_id}-এর অভিভাবকের যোগাযোগ তথ্য আপনার ক্রয়কৃত তালিকায় যোগ হয়েছে।`,
                link: "/user/account/purchases",
            });
            notification_service_1.NotificationService.notify({
                audience: "admin",
                type: "payment",
                title: "যোগাযোগ তথ্য বিক্রি হয়েছে",
                message: `বায়োডাটা নং ${userInfo.user_id} কিনেছেন বায়োডাটা নং ${bioUser.user_id}-এর অভিভাবকের যোগাযোগ তথ্য (৭০ পয়েন্ট)।`,
                link: "/contact-purchases",
            });
            res.status(http_status_1.default.CREATED).json({
                success: true,
                message: "ContactPurchase created successfully",
                data: createdContactPurchase,
            });
        }
        catch (error) {
            // Abort the transaction in case of an error
            yield session.abortTransaction();
            session.endSession();
            console.error("Error creating ContactPurchase:", error);
            res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Internal Server Error",
                error: error.message,
            });
        }
    })),
    updateContactPurchase: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const updatedContactPurchase = yield contact_purchase_data_services_1.ContactPurchaseService.updateContactPurchase(id, updatedFields);
        if (!updatedContactPurchase) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "ContactPurchase not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "ContactPurchase updated successfully",
                data: updatedContactPurchase,
            });
        }
    })),
    deleteContactPurchase: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const id = req.params.id;
        yield contact_purchase_data_services_1.ContactPurchaseService.deleteContactPurchase(id);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "ContactPurchase deleted successfully",
        });
    })),
};
