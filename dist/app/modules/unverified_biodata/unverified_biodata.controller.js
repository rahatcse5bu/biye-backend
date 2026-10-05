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
const bibahoMail_1 = require("../../../shared/bibahoMail");
const notification_service_1 = require("../notifications/notification.service");
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
        console.error("[createUnverifiedBiodata] Validation errors:", validation.errors);
        return res.status(http_status_1.default.BAD_REQUEST).json({
            success: false,
            message: "Validation failed",
            errors: validation.errors,
        });
    }
    // Clean up empty strings for optional fields
    const cleanedData = Object.assign(Object.assign({}, req.body), { created_by: adminId, 
        // Convert empty strings to null for optional fields
        date_of_birth: req.body.date_of_birth
            ? new Date(req.body.date_of_birth)
            : null, zilla: req.body.zilla || null, upzilla: req.body.upzilla || null, division: req.body.division || null, contact_phone: req.body.contact_phone || null });
    try {
        const biodata = yield unverified_biodata_model_1.default.create(cleanedData);
        // Send welcome email to the user with their biodata link
        if (biodata.contact_email) {
            try {
                const biodataLink = `https://www.bibaho.org/biodata/unverified/${biodata._id}`;
                const emailSubject = "Welcome to বিয়ে.ইনফো - Your Biodata Profile Created";
                const emailBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px; }
        .header { background: linear-gradient(135deg, #1a2e1a 0%, #2d4a2d 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
        .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .welcome-text { font-size: 16px; margin-bottom: 20px; }
        .info-box { background: #f0f8f0; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .link-section { margin: 25px 0; text-align: center; }
        .share-link { background: #4CAF50; color: white; padding: 15px; border-radius: 6px; display: inline-block; word-break: break-all; font-weight: bold; }
        .benefits { margin: 20px 0; }
        .benefit-item { padding: 10px 0; padding-left: 25px; position: relative; }
        .benefit-item:before { content: "✓"; position: absolute; left: 0; color: #4CAF50; font-weight: bold; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
        .cta-button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 15px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>স্বাগতম দ্বি.ইনফোতে</h1>
            <p>Welcome to বিয়ে.ইনফো - Matrimony Platform</p>
        </div>
        <div class="content">
            <p class="welcome-text">
                আপনার সাথে যোগাযোগ করতে পেরে আমরা আনন্দিত। আপনার তথ্য সফলভাবে আমাদের প্ল্যাটফর্মে যোগ করা হয়েছে।
            </p>
            
            <div class="info-box">
                <strong>Good news!</strong> আপনার বায়োডেটা প্রোফাইল এখন লাইভ আছে এবং সম্ভাব্য ম্যাচদের কাছে দৃশ্যমান।
            </div>

            <h3 style="color: #1a2e1a;">আপনার প্রোফাইল লিঙ্ক:</h3>
            <div class="link-section">
                <div class="share-link">${biodataLink}</div>
            </div>

            <div class="benefits">
                <h3 style="color: #1a2e1a;">এই লিঙ্কটি শেয়ার করুন এবং পান:</h3>
                <div class="benefit-item">আরও ভালো সাড়া এবং মিলের সম্ভাবনা</div>
                <div class="benefit-item">পরিবার এবং বন্ধুদের সাথে সহজে শেয়ার করুন</div>
                <div class="benefit-item">আপনার প্রোফাইল সম্পূর্ণ নিয়ন্ত্রণে থাকে</div>
                <div class="benefit-item">যেকোনো সময় আপডেট করুন</div>
            </div>

            <h3 style="color: #1a2e1a;">আপনার প্রোফাইল দেখতে:</h3>
            <p>নিচের বাটনে ক্লিক করুন অথবা উপরের লিঙ্কটি আপনার ব্রাউজারে কপি করুন।</p>
            <p style="text-align: center;">
                <a href="${biodataLink}" class="cta-button">আপনার প্রোফাইল দেখুন</a>
            </p>

            <h3 style="color: #1a2e1a;">প্রশ্ন থাকলে?</h3>
            <p>আমাদের সাথে যোগাযোগ করুন info@bibaho.org এ অথবা আমাদের ওয়েবসাইট visit করুন।</p>

            <div class="footer">
                <p>সর্বদা আমাদের সাথে থাকার জন্য ধন্যবাদ। বিয়ে.ইনফো টিম</p>
                <p>© 2026 বিয়ে.ইনফো | সকল অধিকার সংরক্ষিত</p>
            </div>
        </div>
    </div>
</body>
</html>
        `;
                // Send email asynchronously (don't wait for it)
                (0, SendEmail_1.default)(biodata.contact_email, emailSubject, emailBody).catch((emailError) => {
                    console.warn("[createUnverifiedBiodata] Email sending failed:", emailError.message);
                    // Don't fail the API response if email fails
                });
            }
            catch (emailError) {
                console.warn("[createUnverifiedBiodata] Email preparation failed:", emailError.message);
                // Continue with response even if email fails
            }
        }
        res.status(201).json({
            success: true,
            message: "Unverified biodata created successfully",
            data: biodata,
        });
    }
    catch (dbError) {
        console.error("[createUnverifiedBiodata] Database error:", dbError.message);
        // Handle validation errors from MongoDB schema
        if (dbError.name === "ValidationError") {
            const errors = Object.entries(dbError.errors).map(([key, err]) => `${key}: ${err.message}`);
            return res.status(http_status_1.default.UNPROCESSABLE_ENTITY).json({
                success: false,
                message: "Database validation failed",
                errors,
            });
        }
        throw dbError;
    }
}));
const getAllUnverifiedBiodatas = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const { page = 1, limit = 12, bio_type, bio_gender, gender, marital_status, marital_status_en, religion, religious_type, zilla, division, upazila, upzilla, minAge, maxAge, minHeight, maxHeight, complexion, sortOrder = "desc", } = req.query;
    const getQueryValue = (value) => {
        if (typeof value === "string")
            return value.trim();
        if (Array.isArray(value)) {
            const firstString = value.find((item) => typeof item === "string");
            return typeof firstString === "string" ? firstString.trim() : undefined;
        }
        return undefined;
    };
    const getCsvValues = (value) => {
        const queryValues = Array.isArray(value) ? value : [value];
        const csvValues = [];
        queryValues.forEach((queryValue) => {
            if (typeof queryValue === "string") {
                csvValues.push(...queryValue
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean));
            }
        });
        return Array.from(new Set(csvValues));
    };
    const getNonNegativeNumber = (value, integerOnly = false) => {
        const queryValue = getQueryValue(value);
        if (!queryValue)
            return undefined;
        const parsedValue = Number(queryValue);
        if (!Number.isFinite(parsedValue) ||
            parsedValue < 0 ||
            (integerOnly && !Number.isInteger(parsedValue))) {
            return undefined;
        }
        return parsedValue;
    };
    const pageNumber = Number((_b = getQueryValue(page)) !== null && _b !== void 0 ? _b : page);
    const limitNumber = Number((_c = getQueryValue(limit)) !== null && _c !== void 0 ? _c : limit);
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
        return res.status(http_status_1.default.BAD_REQUEST).json({
            success: false,
            message: "page must be an integer greater than or equal to 1",
        });
    }
    if (!Number.isInteger(limitNumber) ||
        limitNumber < 1 ||
        limitNumber > 100) {
        return res.status(http_status_1.default.BAD_REQUEST).json({
            success: false,
            message: "limit must be an integer between 1 and 100",
        });
    }
    const filter = { is_active: true };
    const BIO_TYPE_VARIANTS = {
        male: ["পাত্রের বায়োডাটা", "পাত্রের বায়োডাটা"],
        groom: ["পাত্রের বায়োডাটা", "পাত্রের বায়োডাটা"],
        female: ["পাত্রীর বায়োডাটা", "পাত্রীর বায়োডাটা"],
        bride: ["পাত্রীর বায়োডাটা", "পাত্রীর বায়োডাটা"],
        "পাত্রের বায়োডাটা": ["পাত্রের বায়োডাটা", "পাত্রের বায়োডাটা"],
        "পাত্রের বায়োডাটা": ["পাত্রের বায়োডাটা", "পাত্রের বায়োডাটা"],
        "পাত্রীর বায়োডাটা": ["পাত্রীর বায়োডাটা", "পাত্রীর বায়োডাটা"],
        "পাত্রীর বায়োডাটা": ["পাত্রীর বায়োডাটা", "পাত্রীর বায়োডাটা"],
    };
    const bioGenderValue = (_d = getQueryValue(bio_gender)) === null || _d === void 0 ? void 0 : _d.toLowerCase();
    const bioTypeValue = getQueryValue(bio_type);
    const resolvedBioTypes = bioGenderValue
        ? ((_e = BIO_TYPE_VARIANTS[bioGenderValue]) !== null && _e !== void 0 ? _e : (bioTypeValue
            ? ((_f = BIO_TYPE_VARIANTS[bioTypeValue]) !== null && _f !== void 0 ? _f : [bioTypeValue])
            : []))
        : bioTypeValue
            ? ((_g = BIO_TYPE_VARIANTS[bioTypeValue]) !== null && _g !== void 0 ? _g : [bioTypeValue])
            : [];
    if (resolvedBioTypes.length > 0) {
        filter.bio_type = { $in: resolvedBioTypes };
    }
    const genderValue = getQueryValue(gender);
    if (genderValue)
        filter.gender = genderValue;
    const MARITAL_STATUS_MAP = {
        unmarried: "অবিবাহিত",
        single: "অবিবাহিত",
        married: "বিবাহিত",
        divorced: "ডিভোর্সড",
        widow: "বিধবা",
        widowed: "বিধবা",
        widower: "বিপত্নীক",
    };
    const maritalStatusAlias = (_h = getQueryValue(marital_status_en)) === null || _h === void 0 ? void 0 : _h.toLowerCase();
    const maritalStatusValue = getQueryValue(marital_status);
    const resolvedMaritalStatus = maritalStatusAlias
        ? ((_j = MARITAL_STATUS_MAP[maritalStatusAlias]) !== null && _j !== void 0 ? _j : maritalStatusValue)
        : maritalStatusValue;
    if (resolvedMaritalStatus)
        filter.marital_status = resolvedMaritalStatus;
    const religionValue = getQueryValue(religion);
    if (religionValue)
        filter.religion = religionValue;
    const religiousTypeValue = getQueryValue(religious_type);
    if (religiousTypeValue)
        filter.religious_type = religiousTypeValue;
    const zillaValues = getCsvValues(zilla);
    if (zillaValues.length > 0)
        filter.zilla = { $in: zillaValues };
    const divisionValues = getCsvValues(division);
    if (divisionValues.length > 0 &&
        !divisionValues.some((value) => value.toLowerCase() === "all")) {
        filter.division = { $in: divisionValues };
    }
    const upazilaValues = Array.from(new Set([...getCsvValues(upazila), ...getCsvValues(upzilla)]));
    if (upazilaValues.length > 0) {
        filter.upzilla = { $in: upazilaValues };
    }
    const minimumAge = getNonNegativeNumber(minAge, true);
    const maximumAge = getNonNegativeNumber(maxAge, true);
    if (minimumAge !== undefined || maximumAge !== undefined) {
        const now = new Date();
        const currentYear = now.getUTCFullYear();
        const currentMonth = now.getUTCMonth();
        const currentDay = now.getUTCDate();
        const getBirthdayBoundary = (yearsAgo, endOfDay = false) => {
            const targetYear = currentYear - yearsAgo;
            const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, currentMonth + 1, 0)).getUTCDate();
            const targetDay = Math.min(currentDay, lastDayOfTargetMonth);
            return new Date(Date.UTC(targetYear, currentMonth, targetDay, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0));
        };
        const dateOfBirthConditions = { $ne: null };
        if (minimumAge !== undefined) {
            dateOfBirthConditions.$lte = getBirthdayBoundary(minimumAge, true);
        }
        if (maximumAge !== undefined) {
            const earliestDateOfBirth = getBirthdayBoundary(maximumAge + 1);
            earliestDateOfBirth.setUTCDate(earliestDateOfBirth.getUTCDate() + 1);
            dateOfBirthConditions.$gte = earliestDateOfBirth;
        }
        filter.date_of_birth = dateOfBirthConditions;
    }
    const minimumHeight = getNonNegativeNumber(minHeight);
    const maximumHeight = getNonNegativeNumber(maxHeight);
    if (minimumHeight !== undefined || maximumHeight !== undefined) {
        const feetConditions = {};
        const centimeterConditions = {};
        if (minimumHeight !== undefined) {
            feetConditions.$gte = minimumHeight;
            centimeterConditions.$gte = minimumHeight * 30.48;
        }
        if (maximumHeight !== undefined) {
            feetConditions.$lte = maximumHeight;
            centimeterConditions.$lte = maximumHeight * 30.48;
        }
        // Verified biodatas store feet while imported unverified records commonly
        // store centimeters. Accept both representations for the shared UI range.
        filter.$or = [
            { height: feetConditions },
            { height: centimeterConditions },
        ];
    }
    const complexionValues = getCsvValues(complexion);
    if (complexionValues.length > 0) {
        filter.screen_color = { $in: complexionValues };
    }
    const skip = (pageNumber - 1) * limitNumber;
    const sortDirection = ((_k = getQueryValue(sortOrder)) === null || _k === void 0 ? void 0 : _k.toLowerCase()) === "asc" ? 1 : -1;
    const sort = { createdAt: sortDirection, _id: sortDirection };
    const [biodatas, total] = yield Promise.all([
        unverified_biodata_model_1.default.find(filter)
            .select("-contact_name -contact_phone -contact_email")
            .sort(sort)
            .skip(skip)
            .limit(limitNumber)
            .lean(),
        unverified_biodata_model_1.default.countDocuments(filter),
    ]);
    res.status(200).json({
        success: true,
        data: biodatas,
        meta: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
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
    var _l;
    const userId = (_l = req.user) === null || _l === void 0 ? void 0 : _l._id;
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
        // Commit the transaction
        yield session.commitTransaction();
        // TODO: email only after the purchase is saved, without delaying the response.
        (0, bibahoMail_1.mailUser)(userInfo.email, "যোগাযোগ তথ্য", {
            title: "আপনার কেনা যোগাযোগ তথ্য",
            tone: "success",
            paragraphs: [
                "ধন্যবাদ! নিচে বায়োডাটার যোগাযোগ তথ্য দেওয়া হলো। এই তথ্য আপনার অ্যাকাউন্টের \"ক্রয়কৃত\" অংশেও দেখতে পাবেন।",
                "অনুগ্রহ করে শালীনতা বজায় রেখে যোগাযোগ করুন।",
            ],
            details: [
                { label: "বায়োডাটা নং", value: biodata.bio_id },
                { label: "নাম", value: biodata.contact_name },
                { label: "মোবাইল নম্বর", value: biodata.contact_phone },
                { label: "ইমেইল", value: biodata.contact_email },
                { label: "খরচ হওয়া পয়েন্ট", value: 50 },
                { label: "অবশিষ্ট পয়েন্ট", value: remainingPoints },
            ],
            action: { label: "ক্রয়কৃত বায়োডাটা দেখুন", path: "/user/account/purchases" },
        });
        notification_service_1.NotificationService.notify({
            audience: "admin",
            type: "payment",
            title: "আনভেরিফাইড বায়োডাটার যোগাযোগ তথ্য বিক্রি",
            message: `বায়োডাটা নং ${userInfo.user_id} কিনেছেন আনভেরিফাইড বায়োডাটা নং ${biodata.bio_id}-এর যোগাযোগ তথ্য (৫০ পয়েন্ট)।`,
            link: "/unverified-biodatas",
        });
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
    var _m, _o, _p, _q;
    const { biodata_text } = req.body;
    if (!biodata_text || typeof biodata_text !== "string") {
        return res.status(http_status_1.default.BAD_REQUEST).json({
            success: false,
            message: "biodata_text is required and must be a string",
        });
    }
    try {
        // Truncate very long text to avoid exceeding token limits
        const maxChars = 2000;
        const truncatedText = biodata_text.length > maxChars
            ? biodata_text.substring(0, maxChars) + "..."
            : biodata_text;
        const { callGroqAPI } = require("../../../services/groqService");
        const response = yield callGroqAPI([
            {
                role: "system",
                content: `You are a biodata data extraction specialist. Extract ONLY custom/additional fields from biodata text.

IGNORE standard fields: name, phone, email, gender, DOB, height, weight, blood group, religion, marital status, address, nationality, complexion.

Extract custom fields like: profession, education, income, family background, interests, lifestyle, requirements.

For each field, determine type: "text"|"numeric"|"email"|"phone"|"select"|"boolean"

Return a JSON array: [{"label":"Field name","value":"Sample value","fieldType":"text","options":[]}]
Only return JSON array, no other text or markdown.`,
            },
            {
                role: "user",
                content: `Extract custom fields from: ${truncatedText}`,
            },
        ], "meta-llama/llama-4-scout-17b-16e-instruct", 0.3, 800);
        // Safely access response content
        if (!response || !response.choices || !response.choices[0]) {
            console.warn("Invalid Groq response structure");
            return res.status(200).json({
                success: true,
                data: [],
                message: "Could not parse fields from response",
            });
        }
        const content = (_m = response.choices[0].message) === null || _m === void 0 ? void 0 : _m.content;
        if (!content) {
            console.warn("No content in Groq response");
            return res.status(200).json({
                success: true,
                data: [],
                message: "No content received from LLM",
            });
        }
        // Remove markdown code blocks if present
        const cleanedContent = content
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();
        const jsonMatch = cleanedContent.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.warn("No JSON array found in response:", cleanedContent.substring(0, 200));
            return res.status(200).json({
                success: true,
                data: [],
                message: "No custom fields found",
            });
        }
        let parsed;
        try {
            parsed = JSON.parse(jsonMatch[0]);
        }
        catch (jsonError) {
            console.error("JSON parse error:", jsonError);
            return res.status(200).json({
                success: true,
                data: [],
                message: "Could not parse JSON from response",
            });
        }
        // Ensure parsed is an array
        if (!Array.isArray(parsed)) {
            console.warn("Parsed response is not an array");
            return res.status(200).json({
                success: true,
                data: [],
                message: "Invalid response format",
            });
        }
        const fields = parsed.filter((f) => f &&
            f.label &&
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
        const detail = ((_q = (_p = (_o = error.response) === null || _o === void 0 ? void 0 : _o.data) === null || _p === void 0 ? void 0 : _p.error) === null || _q === void 0 ? void 0 : _q.message) ||
            error.message ||
            "Unknown error";
        console.error("LLM parsing error:", detail);
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
