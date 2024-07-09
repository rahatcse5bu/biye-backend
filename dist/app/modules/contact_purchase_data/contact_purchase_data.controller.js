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
const SendEmail_1 = __importDefault(require("../../../shared/SendEmail"));
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
            // bio html
            const bioHtml = `
      <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                }
                .container {
                    width: 100%;
                    max-width: 600px;
                    margin: auto;
                    padding: 20px;
                    border: 1px solid #e0e0e0;
                    border-radius: 10px;
                }
                .header {
                    background-color: #4CAF50;
                    color: white;
                    padding: 10px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }
                .content {
                    padding: 20px;
                }
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    color: #888;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Contact Information Shared</h1>
                </div>
                <div class="content">
                    <p>Dear Sir/Mam,</p>
                    <p>We wanted to inform you that your contact information has been purchased using points on our platform.</p>
                    <p>Here are the details:</p>
                    <ul>
                        <li><strong>Buyer's BioId:</strong> ${bioUser.user_id}</li>
                        <li><strong>Email:</strong>${bioUser.email}</li>
                    </ul>
                    <p>If you have any questions or concerns, please reach out to our support team.</p>
                    <p>Thank you for being a part of our community!</p>
                    <p>Best Regards,</p>
                    <p>[Your Company Name]</p>
            <p><a href="http://www.pnc-nikah.com">Visit our website</a> for more information.</p>

                </div>
                <div class="footer">
                    <p>&copy; 2024 PNC-Nikah. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>

      
      `;
            yield (0, SendEmail_1.default)(bioUser.email, "Contact Information Shared", bioHtml);
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
            const userHtml = `
    <!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: auto;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 10px;
        }
        .header {
            background-color: #4CAF50;
            color: white;
            padding: 10px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            padding: 20px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Purchase Confirmation</h1>
        </div>
        <div class="content">
            <p>Dear Sir/Mam,</p>
            <p>Thank you for your purchase!</p>
            <p>You have successfully bought the contact information of ${bioContact.full_name} using your 70 points.now you have ${points} points. </p>
            <p>Here are the details:</p>
            <ul>
                <li><strong>Full Name:</strong> ${bioContact.full_name}</li>
                <li><strong>Email:</strong> ${bioContact.bio_receiving_email}</li>
                <li><strong>Phone:</strong> ${bioContact.family_number}</li>
            </ul>
            <p>If you have any questions, feel free to contact our support team.</p>
            <p>Thank you for using our service!</p>
            <p>Best Regards,</p>
            <p>PNC-Nikah</p>
            <p><a href="http://www.pnc-nikah.com">Visit our website</a> for more information.</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 PNC-Nikah. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  
      `;
            yield (0, SendEmail_1.default)(userInfo.email, "Purchase Confirmation", userHtml);
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
