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
exports.ContactController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const contact_services_1 = require("./contact.services");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const user_info_model_1 = require("../user_info/user_info.model");
const mongoose_1 = __importDefault(require("mongoose"));
const SendEmail_1 = require("../../../shared/SendEmail");
const user_info_constant_1 = require("../user_info/user_info.constant");
exports.ContactController = {
    getAllContacts: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const contacts = yield contact_services_1.ContactService.getAllContacts();
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "All contacts retrieved successfully",
            data: contacts,
        });
    })),
    getContactById: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const id = req.params.id;
        const contact = yield contact_services_1.ContactService.getContactById(id);
        if (!contact) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "Contact not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "Contact retrieved successfully",
                data: contact,
            });
        }
    })),
    getContactByToken: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const contact = yield contact_services_1.ContactService.getContactByToken(userId);
        if (!contact) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "Contact not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "Contact retrieved successfully",
                data: contact,
            });
        }
    })),
    createContact: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _b, _c;
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            let _d = req.body, { user_form } = _d, contactData = __rest(_d, ["user_form"]);
            contactData.user = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
            // Create contact
            const createdContact = yield contact_services_1.ContactService.createContact(contactData, {
                session,
            });
            // Find user and update the fields
            const user = yield user_info_model_1.UserInfoModel.findById((_c = req.user) === null || _c === void 0 ? void 0 : _c._id).session(session);
            user.edited_timeline_index = Math.max(user.edited_timeline_index, user_form);
            user.last_edited_timeline_index = user_form;
            yield user.save({ session });
            // Commit the transaction
            yield session.commitTransaction();
            session.endSession();
            res.status(http_status_1.default.CREATED).json({
                success: true,
                message: "Contact created successfully",
                data: createdContact,
            });
        }
        catch (error) {
            // If any error occurs, abort the transaction
            yield session.abortTransaction();
            session.endSession();
            res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "An error occurred while creating the contact",
                error: error.message,
            });
        }
    })),
    createContactUsByEmail: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { name, email, phone, bio, message } = req.body;
        const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                color: #333;
                margin: 0;
                padding: 0;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                padding: 10px 0;
                background: linear-gradient(to right, #4CAF50, #1E90FF);
                color: white;
                border-radius: 8px 8px 0 0;
            }
            .content {
                padding: 20px;
            }
            .content p {
                line-height: 1.6;
                margin: 10px 0;
            }
            .content .highlight {
                font-weight: bold;
                color: #333;
            }
            .footer {
                text-align: center;
                padding: 10px 0;
                font-size: 12px;
                color: #888;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>New Contact Form Submission</h2>
            </div>
            <div class="content">
                <p>Hello Admin,</p>
                <p>You have received a new message from the contact form on your website. Here are the details:</p>
                <p><span class="highlight">Name:</span> ${name}</p>
                <p><span class="highlight">Email:</span> ${email}</p>
                <p><span class="highlight">Phone:</span> ${phone}</p>
                <p><span class="highlight">Bio:</span> ${bio}</p>
                <p><span class="highlight">Message:</span> ${message}</p>
                <p>Please respond to this message as soon as possible.</p>
            </div>
           
        </div>
    </body>
    </html>
  `;
        yield (0, SendEmail_1.sendEmails)(user_info_constant_1.adminEmails, "New Contact Form Submission", htmlContent);
        res.json({ success: true, message: "Email sent successfully" });
    })),
    updateContact: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _e;
        const id = (_e = req.user) === null || _e === void 0 ? void 0 : _e._id;
        if (!id) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const updatedFields = req.body;
        const updatedContact = yield contact_services_1.ContactService.updateContact(id, updatedFields);
        if (!updatedContact) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "Contact not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "Contact updated successfully",
                data: updatedContact,
            });
        }
    })),
    deleteContact: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const id = req.params.id;
        yield contact_services_1.ContactService.deleteContact(id);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Contact deleted successfully",
        });
    })),
};
