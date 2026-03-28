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
exports.UnverifiedBiodataController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const unverified_biodata_model_1 = __importDefault(require("./unverified_biodata.model"));
const user_info_model_1 = require("../user_info/user_info.model");
const mongoose_1 = __importDefault(require("mongoose"));
const unverified_contact_purchase_service_1 = require("../unverified_contact_purchase/unverified_contact_purchase.service");
const unverified_biodata_validation_1 = require("./unverified_biodata.validation");
const http_status_1 = __importDefault(require("http-status"));
const SendEmail_1 = __importDefault(require("../../../shared/SendEmail"));
const createUnverifiedBiodata = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!adminId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    // Validate extra_fields if provided
    const validation = (0, unverified_biodata_validation_1.validateExtraFields)(req.body.extra_fields);
    if (!validation.isValid) {
        return res.status(http_status_1.default.BAD_REQUEST).json({
            success: false,
            message: "Validation failed",
            errors: validation.errors,
        });
    }
    const data = Object.assign(Object.assign({}, req.body), { created_by: adminId });
    const biodata = yield unverified_biodata_model_1.default.create(data);
    res.status(201).json({
        success: true,
        message: "Unverified biodata created successfully",
        data: biodata,
    });
}));
const getAllUnverifiedBiodatas = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 12, bio_type, gender, marital_status, religion, zilla, sortOrder = "desc", } = req.query;
    const filter = { is_active: true };
    if (bio_type)
        filter.bio_type = bio_type;
    if (gender)
        filter.gender = gender;
    if (marital_status)
        filter.marital_status = marital_status;
    if (religion)
        filter.religion = religion;
    if (zilla)
        filter.zilla = zilla;
    const skip = (Number(page) - 1) * Number(limit);
    const sort = { createdAt: sortOrder === "asc" ? 1 : -1 };
    const [biodatas, total] = yield Promise.all([
        unverified_biodata_model_1.default.find(filter)
            .select("-contact_name -contact_phone -contact_email")
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        unverified_biodata_model_1.default.countDocuments(filter),
    ]);
    res.status(200).json({
        success: true,
        data: biodatas,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        },
    });
}));
const getAllUnverifiedBiodatasByAdmin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (search) {
        filter.$or = [
            { contact_name: { $regex: search, $options: "i" } },
            { zilla: { $regex: search, $options: "i" } },
        ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [biodatas, total] = yield Promise.all([
        unverified_biodata_model_1.default.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        unverified_biodata_model_1.default.countDocuments(filter),
    ]);
    res.status(200).json({
        success: true,
        data: biodatas,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        totalItems: total,
    });
}));
const getUnverifiedBiodataById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const biodata = yield unverified_biodata_model_1.default.findById(id)
        .select("-contact_name -contact_phone -contact_email")
        .lean();
    if (!biodata) {
        return res.status(404).json({ success: false, message: "Not found" });
    }
    // Increment views
    yield unverified_biodata_model_1.default.findByIdAndUpdate(id, { $inc: { views_count: 1 } });
    res.status(200).json({ success: true, data: biodata });
}));
const updateUnverifiedBiodata = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // Validate extra_fields if provided
    if (req.body.extra_fields) {
        const validation = (0, unverified_biodata_validation_1.validateExtraFields)(req.body.extra_fields);
        if (!validation.isValid) {
            return res.status(http_status_1.default.BAD_REQUEST).json({
                success: false,
                message: "Validation failed",
                errors: validation.errors,
            });
        }
    }
    const updated = yield unverified_biodata_model_1.default.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
    });
    if (!updated) {
        return res.status(404).json({ success: false, message: "Not found" });
    }
    res.status(200).json({
        success: true,
        message: "Updated successfully",
        data: updated,
    });
}));
const deleteUnverifiedBiodata = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    yield unverified_biodata_model_1.default.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Deleted successfully" });
}));
const purchaseUnverifiedBiodataContact = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
    if (!userId) {
        return res.status(http_status_1.default.UNAUTHORIZED).json({
            statusCode: http_status_1.default.UNAUTHORIZED,
            message: "You are not authorized",
            success: false,
        });
    }
    const { id } = req.params; // unverified_biodata id
    // Start a session for the transaction
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // Check user has enough points
        const userInfo = yield user_info_model_1.UserInfoModel.findById(userId).session(session);
        if (!userInfo) {
            yield session.abortTransaction();
            session.endSession();
            return res.status(http_status_1.default.NOT_FOUND).json({
                statusCode: http_status_1.default.NOT_FOUND,
                message: "User info not found",
                success: false,
            });
        }
        // Check if unverified biodata exists
        const biodata = yield unverified_biodata_model_1.default.findById(id).session(session);
        if (!biodata) {
            yield session.abortTransaction();
            session.endSession();
            return res.status(http_status_1.default.NOT_FOUND).json({
                statusCode: http_status_1.default.NOT_FOUND,
                message: "Biodata not found",
                success: false,
            });
        }
        // Check if already purchased
        const existingPurchase = yield unverified_contact_purchase_service_1.UnverifiedContactPurchaseService.getUnverifiedContactPurchaseByUserAndBiodata(userId, id, session);
        if (existingPurchase) {
            yield session.abortTransaction();
            session.endSession();
            return res.status(http_status_1.default.BAD_REQUEST).json({
                statusCode: http_status_1.default.BAD_REQUEST,
                message: "You have already purchased contact info for this biodata",
                success: false,
            });
        }
        // Check points
        if (userInfo.points < 50) {
            yield session.abortTransaction();
            session.endSession();
            return res.status(http_status_1.default.BAD_REQUEST).json({
                statusCode: http_status_1.default.BAD_REQUEST,
                message: "You do not have enough points to buy (need 50 points)",
                success: false,
            });
        }
        // Create purchase record
        const purchaseData = {
            user: userId,
            unverified_biodata: id,
            points_spent: 50,
            contact_info: {
                full_name: biodata.contact_name,
                family_number: biodata.contact_phone,
                bio_receiving_email: biodata.contact_email,
            },
        };
        const [createdPurchase] = yield unverified_contact_purchase_service_1.UnverifiedContactPurchaseService.createUnverifiedContactPurchase(purchaseData, { session });
        // Update user points
        const remainingPoints = userInfo.points - 50;
        userInfo.points = remainingPoints;
        yield userInfo.save({ session });
        // Increment purchases count on biodata
        yield unverified_biodata_model_1.default.findByIdAndUpdate(id, { $inc: { purchases_count: 1 } }, { session });
        // Send confirmation email to buyer
        const buyerHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; }
                .container { width: 100%; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; }
                .header { background-color: #4CAF50; color: white; padding: 10px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { padding: 20px; }
                .footer { text-align: center; margin-top: 20px; color: #888; }
                .contact-box { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Contact Information Purchased</h1>
                </div>
                <div class="content">
                    <p>Dear Sir/Madam,</p>
                    <p>Thank you for your purchase! You have successfully bought the contact information for 50 points.</p>
                    <p>Your remaining points: <strong>${remainingPoints}</strong></p>
                    <div class="contact-box">
                        <h3>Contact Details:</h3>
                        <p><strong>Name:</strong> ${biodata.contact_name}</p>
                        <p><strong>Phone:</strong> ${biodata.contact_phone}</p>
                        <p><strong>Email:</strong> ${biodata.contact_email}</p>
                    </div>
                    <p>If you have any questions, please contact our support team.</p>
                    <p>Best Regards,<br>PNC-Nikah Team</p>
                    <p><a href="http://www.pnc-nikah.com">Visit our website</a></p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 PNC-Nikah. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `;
        yield (0, SendEmail_1.default)(userInfo.email, "Contact Information Purchase Confirmation", buyerHtml);
        // Commit the transaction
        yield session.commitTransaction();
        session.endSession();
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Contact information purchased successfully",
            data: {
                contact_info: purchaseData.contact_info,
                points_spent: 50,
                remaining_points: remainingPoints,
            },
        });
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        console.error("Error purchasing contact info:", error);
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}));
const parseCustomFieldsWithLLM = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    const { biodata_text } = req.body;
    if (!biodata_text || typeof biodata_text !== "string") {
        return res.status(http_status_1.default.BAD_REQUEST).json({
            success: false,
            message: "biodata_text is required and must be a string",
        });
    }
    try {
        const axios = require("axios");
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        if (!OPENROUTER_API_KEY) {
            return res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "LLM service not configured",
            });
        }
        const response = yield axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: "google/gemma-3-4b-it:free",
            messages: [
                {
                    role: "system",
                    content: `You are a biodata data extraction specialist. Extract ONLY custom/additional fields from biodata text.

IGNORE standard fields: name, phone, email, gender, DOB, height, weight, blood group, religion, marital status, address, nationality, complexion.

Extract custom fields like: profession, education, income, family background, interests, lifestyle, requirements.

For each field, determine type: "text"|"numeric"|"email"|"phone"|"select"|"boolean"

Return a JSON array: [{"label":"Field name","value":"Sample value","fieldType":"text","options":[]}]
Only return JSON array, no other text.`,
                },
                {
                    role: "user",
                    content: `Extract custom fields from: ${biodata_text}`,
                },
            ],
            temperature: 0.3,
            max_tokens: 1000,
            top_p: 0.7,
        }, {
            headers: {
                Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": "http://localhost:5000",
                "X-Title": "PNC Nikah Backend",
            },
        });
        const content = response.data.choices[0].message.content;
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            return res.status(200).json({
                success: true,
                data: [],
                message: "No custom fields found",
            });
        }
        const parsed = JSON.parse(jsonMatch[0]);
        const fields = parsed
            .filter((f) => f.label &&
            f.value !== undefined &&
            f.value !== null &&
            f.fieldType);
        res.status(200).json({
            success: true,
            data: fields,
            message: `Extracted ${fields.length} custom field(s)`,
        });
    }
    catch (error) {
        const detail = ((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) || error.message;
        console.error("LLM parsing error:", JSON.stringify(detail));
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to parse fields with LLM",
            error: detail,
        });
    }
}));
exports.UnverifiedBiodataController = {
    createUnverifiedBiodata,
    getAllUnverifiedBiodatas,
    getAllUnverifiedBiodatasByAdmin,
    getUnverifiedBiodataById,
    updateUnverifiedBiodata,
    deleteUnverifiedBiodata,
    purchaseUnverifiedBiodataContact,
    parseCustomFieldsWithLLM,
};
