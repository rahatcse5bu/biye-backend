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
const bibahoMail_1 = require("../../../shared/bibahoMail");
const contact_message_model_1 = __importDefault(require("../contact_message/contact_message.model"));
const notification_service_1 = require("../notifications/notification.service");
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
        var _a, _b;
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            let _c = req.body, { user_form } = _c, contactData = __rest(_c, ["user_form"]);
            contactData.user = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
            // Create contact
            const createdContact = yield contact_services_1.ContactService.createContact(contactData, {
                session,
            });
            // Find user and update the fields
            const user = yield user_info_model_1.UserInfoModel.findById((_b = req.user) === null || _b === void 0 ? void 0 : _b._id).session(session);
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
        var _a, _b, _c, _d, _e;
        // TODO: visitor input is escaped by the template; raw HTML here let anyone send links from our address.
        const text = (value, max) => String(value !== null && value !== void 0 ? value : "").trim().slice(0, max);
        const input = {
            name: text((_a = req.body) === null || _a === void 0 ? void 0 : _a.name, 100),
            email: text((_b = req.body) === null || _b === void 0 ? void 0 : _b.email, 200).toLowerCase(),
            phone: text((_c = req.body) === null || _c === void 0 ? void 0 : _c.phone, 40),
            bio: text((_d = req.body) === null || _d === void 0 ? void 0 : _d.bio, 40),
            message: text((_e = req.body) === null || _e === void 0 ? void 0 : _e.message, 3000),
        };
        if (!input.name || !input.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
            return res.status(http_status_1.default.BAD_REQUEST).json({
                success: false,
                message: "নাম, সঠিক ইমেইল এবং বার্তা দেওয়া আবশ্যক",
            });
        }
        // TODO: saved first so the admin site keeps every message even if the email fails.
        const saved = yield contact_message_model_1.default.create(input);
        (0, bibahoMail_1.mailAdmins)("ওয়েবসাইট থেকে নতুন বার্তা", {
            icon: "support",
            eyebrow: "অ্যাডমিন · সাপোর্ট",
            title: "যোগাযোগ ফর্ম থেকে নতুন বার্তা",
            paragraphs: ["ওয়েবসাইটের যোগাযোগ ফর্ম থেকে একটি নতুন বার্তা এসেছে।"],
            blocks: [{ type: "message", label: "বার্তা", text: input.message }],
            detailsTitle: "প্রেরকের তথ্য",
            details: [
                { label: "নাম", value: input.name },
                { label: "ইমেইল", value: input.email },
                { label: "ফোন", value: input.phone },
                { label: "বায়োডাটা নং", value: input.bio },
            ],
        });
        notification_service_1.NotificationService.notify({
            audience: "admin",
            type: "system",
            priority: "important",
            title: "নতুন যোগাযোগ বার্তা",
            message: `${input.name} (${input.email}) একটি বার্তা পাঠিয়েছেন।`,
            link: "/contact-messages",
        });
        res.status(http_status_1.default.CREATED).json({ success: true, message: "Message sent successfully", data: { _id: saved._id } });
    })),
    updateContact: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
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
