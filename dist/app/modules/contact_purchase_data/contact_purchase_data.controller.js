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
exports.ContactPurchaseController = {
    getAllContactPurchases: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const contactPurchases = yield contact_purchase_data_services_1.ContactPurchaseService.getAllContactPurchases();
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "All contact Purchases retrieved successfully",
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
        const user = req.user._id;
        // Start a session for the transaction
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            // Check points of user info model
            const userInfo = yield user_info_model_1.UserInfoModel.findById(user).session(session);
            if (!userInfo) {
                yield session.abortTransaction();
                session.endSession();
                return res.status(http_status_1.default.NOT_FOUND).json({
                    statusCode: http_status_1.default.NOT_FOUND,
                    message: "User info not found",
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
            userInfo.points -= 70;
            yield userInfo.save({ session });
            // Commit the transaction
            yield session.commitTransaction();
            session.endSession();
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
