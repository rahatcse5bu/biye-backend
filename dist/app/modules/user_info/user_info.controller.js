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
exports.UserInfoController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const user_info_services_1 = require("./user_info.services");
const user_info_model_1 = require("./user_info.model");
const general_info_model_1 = __importDefault(require("../general_info/general_info.model"));
const ApiError_1 = __importDefault(require("../../middlewares/ApiError"));
const user_info_constant_1 = require("./user_info.constant");
const bibahoMail_1 = require("../../../shared/bibahoMail");
const emailTemplates_1 = require("../../../shared/emailTemplates");
const notification_service_1 = require("../notifications/notification.service");
const statusLabels = {
    active: "সক্রিয়",
    inactive: "নিষ্ক্রিয়",
    banned: "নিষিদ্ধ",
    pending: "পর্যালোচনাধীন",
    "in review": "রিভিউ চলছে",
};
const statusNotes = {
    active: "আপনার বায়োডাটা এখন অন্য সদস্যরা দেখতে ও প্রস্তাব পাঠাতে পারবেন।",
    inactive: "নিষ্ক্রিয় অবস্থায় আপনার বায়োডাটা অন্য কেউ দেখতে পাবেন না। যেকোনো সময় সেটিংস থেকে আবার সক্রিয় করতে পারবেন।",
    banned: "নীতিমালা লঙ্ঘনের কারণে আপনার অ্যাকাউন্ট নিষিদ্ধ করা হয়েছে। ভুল মনে হলে এই ইমেইলের উত্তর দিয়ে আমাদের জানান।",
    "in review": "আমাদের টিম আপনার বায়োডাটা যাচাই করছে। স্ট্যাটাস পরিবর্তন হলে আপনাকে ইমেইল ও নোটিফিকেশনে জানানো হবে।",
};
const statusIcons = { active: "check", inactive: "clock", banned: "edit" };
// TODO: branded user + admin emails for a biodata status change; replaces the old raw-HTML ones that dumped the request body.
const mailStatusChange = (user, status, byAdmin) => {
    var _a;
    if (!(user === null || user === void 0 ? void 0 : user.email) || !status)
        return;
    const label = statusLabels[status] || status;
    const inReview = status === "in review";
    if (inReview || (status === "active" && byAdmin)) {
        const mail = inReview
            ? emailTemplates_1.emailTemplates.biodataInReview({ name: user.username, biodataNo: user.user_id })
            : emailTemplates_1.emailTemplates.biodataApproved({ name: user.username, biodataNo: user.user_id });
        (0, bibahoMail_1.mailUser)(user.email, mail.subject, mail.content);
    }
    else {
        (0, bibahoMail_1.mailUser)(user.email, "আপনার বায়োডাটার স্ট্যাটাস পরিবর্তন হয়েছে", {
            icon: statusIcons[status] || "bell",
            eyebrow: label,
            title: "আপনার বায়োডাটার স্ট্যাটাস পরিবর্তন হয়েছে",
            name: user.username,
            paragraphs: [
                `${byAdmin ? "বিবাহ অ্যাডমিন" : "আপনার অনুরোধে"} আপনার বায়োডাটার স্ট্যাটাস পরিবর্তন করা হয়েছে। আপনার বায়োডাটা এখন <strong>${(0, bibahoMail_1.escapeHtml)(label)}</strong>।`,
                ...(statusNotes[status] ? [statusNotes[status]] : []),
            ],
            detailsTitle: "সংক্ষিপ্ত তথ্য",
            details: [
                { label: "বায়োডাটা নং", value: user.user_id },
                { label: "স্ট্যাটাস", value: label },
            ],
            action: { label: "ড্যাশবোর্ড দেখুন", path: "/user/account/dashboard" },
        });
    }
    if (byAdmin)
        return;
    // TODO: a member submitting for review is the main admin task, so it also pops up in the admin panel.
    if (inReview) {
        notification_service_1.NotificationService.notify({
            audience: "admin",
            type: "biodata",
            priority: "important",
            title: "নতুন বায়োডাটা রিভিউয়ের অপেক্ষায়",
            message: `বায়োডাটা নং ${(_a = user.user_id) !== null && _a !== void 0 ? _a : ""} (${user.email}) রিভিউয়ের জন্য জমা দিয়েছেন।`,
            link: "/biodatas?status=pending",
        });
    }
    (0, bibahoMail_1.mailAdmins)(inReview ? "নতুন বায়োডাটা রিভিউয়ের অপেক্ষায়" : "একজন সদস্য বায়োডাটার স্ট্যাটাস পরিবর্তন করেছেন", {
        title: inReview ? "একটি বায়োডাটা রিভিউয়ের জন্য জমা হয়েছে" : "একজন সদস্য বায়োডাটার স্ট্যাটাস পরিবর্তন করেছেন",
        paragraphs: [
            inReview
                ? "অনুগ্রহ করে বায়োডাটাটি যাচাই করে স্ট্যাটাস আপডেট করুন।"
                : `সদস্য নিজে তার বায়োডাটা <strong>${(0, bibahoMail_1.escapeHtml)(label)}</strong> করেছেন।`,
        ],
        details: [
            { label: "বায়োডাটা নং", value: user.user_id },
            { label: "ইমেইল", value: user.email },
            { label: "স্ট্যাটাস", value: label },
        ],
        action: { label: "বায়োডাটা দেখুন", path: `/biodata/${user.user_id}` },
    });
};
exports.UserInfoController = {
    getAllUserInfo: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const userInfo = yield user_info_services_1.UserInfoService.getAllUserInfo();
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "All user info retrieved successfully",
            data: userInfo,
        });
    })),
    sendUserEmail: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const email = req.params.email;
        const { subject, body } = req.body;
        // TODO: admin-written HTML body, sent in the standard branded layout.
        yield (0, bibahoMail_1.mailUserNow)(email, String(subject !== null && subject !== void 0 ? subject : ""), { title: String(subject !== null && subject !== void 0 ? subject : ""), icon: "support", paragraphs: [String(body !== null && body !== void 0 ? body : "")] });
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "email is sent",
        });
    })),
    getUserInfoById: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const id = req.params.id;
        const userInfo = yield user_info_services_1.UserInfoService.getUserInfoById(id);
        if (!userInfo) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "User info not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "User info retrieved successfully",
                data: userInfo,
            });
        }
    })),
    getUserStatus: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const id = req.params.id;
        const userStatus = yield user_info_services_1.UserInfoService.getUserStatus(id);
        if (!userStatus) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "User info not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "User info retrieved successfully",
                data: userStatus,
            });
        }
    })),
    getUserInfoByEmail: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const email = req.params.email;
        const userInfo = yield user_info_services_1.UserInfoService.getUserInfoByEmail(email);
        // TODO: users may only read their own account (same 403 whether or not the email exists); admins can read any.
        const isOwner = Boolean(userInfo) && String(userInfo === null || userInfo === void 0 ? void 0 : userInfo._id) === String((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        if (!isOwner && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.user_role) !== "admin") {
            return res.status(http_status_1.default.FORBIDDEN).json({
                success: false,
                message: "Forbidden",
            });
        }
        if (!userInfo) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        else {
            res.status(200).json({
                message: "User retrieved successfully",
                success: true,
                data: userInfo,
            });
        }
    })),
    createUserInfo: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const userInfo = req.body;
        const createdUserInfo = yield user_info_services_1.UserInfoService.createUserInfo(userInfo);
        res.status(http_status_1.default.CREATED).json({
            success: true,
            message: "User info created successfully",
            data: createdUserInfo,
        });
    })),
    googleAuth: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const authData = yield user_info_services_1.UserInfoService.googleAuth(req.body);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Google authentication successful",
            data: authData,
        });
    })),
    register: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const authData = yield user_info_services_1.UserInfoService.register(req.body);
        res.status(http_status_1.default.CREATED).json({
            success: true,
            message: "User registered successfully",
            data: authData,
        });
    })),
    login: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const authData = yield user_info_services_1.UserInfoService.login(req.body);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Login successful",
            data: authData,
        });
    })),
    forgotPassword: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        yield user_info_services_1.UserInfoService.forgotPassword(req.body);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "If an account exists for this email, a reset link has been sent",
        });
    })),
    resetPassword: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        yield user_info_services_1.UserInfoService.resetPassword(req.body);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Password reset successfully",
        });
    })),
    changePassword: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!id) {
            throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "You are not authorized");
        }
        // TODO: other sessions are revoked; the caller keeps working with this fresh token.
        const data = yield user_info_services_1.UserInfoService.changePassword(String(id), req.body);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Password changed successfully",
            data,
        });
    })),
    // TODO: only whitelisted preference fields; nothing else on the account can change here.
    updateMyPreferences: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const religion = (_a = req.body) === null || _a === void 0 ? void 0 : _a.preferred_religion;
        const allowed = ["islam", "hinduism", "christianity", "all"];
        if (!allowed.includes(religion)) {
            return res.status(http_status_1.default.BAD_REQUEST).json({
                success: false,
                message: `preferred_religion must be one of: ${allowed.join(", ")}`,
            });
        }
        const updated = yield user_info_model_1.UserInfoModel.findByIdAndUpdate((_b = req.user) === null || _b === void 0 ? void 0 : _b._id, { preferred_religion: religion }, { new: true })
            .select("preferred_religion")
            .lean();
        if (!updated) {
            return res.status(http_status_1.default.NOT_FOUND).json({ success: false, message: "User not found" });
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Preferences updated successfully",
            data: { preferred_religion: updated.preferred_religion },
        });
    })),
    getMe: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!id) {
            throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "You are not authorized");
        }
        const userInfo = yield user_info_services_1.UserInfoService.getCurrentUser(String(id));
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "User info retrieved successfully",
            data: userInfo,
        });
    })),
    updateUserInfo: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!id) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        // TODO: allowlist; passing the raw body let users set user_role/points/email (or $set them) on their own account.
        const others = { user_status: (_b = req.body) === null || _b === void 0 ? void 0 : _b.user_status };
        if (!user_info_constant_1.userRoleChangeByUser.includes(others.user_status)) {
            throw new ApiError_1.default(403, "You are not allowed to set this status");
        }
        const current = yield user_info_model_1.UserInfoModel.findById(id).select("user_status").lean();
        if ((current === null || current === void 0 ? void 0 : current.user_status) === "banned") {
            throw new ApiError_1.default(403, "Your account is banned");
        }
        const updatedUserInfo = yield user_info_services_1.UserInfoService.updateUserInfo(id, others);
        if (!updatedUserInfo) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "User info not found",
            });
        }
        if ((others === null || others === void 0 ? void 0 : others.user_status) === "in review" || (others === null || others === void 0 ? void 0 : others.user_status) === "inactive") {
            mailStatusChange(updatedUserInfo, others.user_status, false);
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "User info updated successfully",
            data: updatedUserInfo,
        });
    })),
    updateUserStatusByUser: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!id) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const { user_status } = req.body;
        // TODO: users may hide their biodata, but only an admin-approved one can be switched back to active.
        if (user_status !== "active" && user_status !== "inactive") {
            throw new ApiError_1.default(400, "user_status must be active or inactive");
        }
        const current = yield user_info_model_1.UserInfoModel.findById(id).select("user_status").lean();
        if ((current === null || current === void 0 ? void 0 : current.user_status) === "banned") {
            throw new ApiError_1.default(403, "Your account is banned");
        }
        if (user_status === "active") {
            const bio = yield general_info_model_1.default.findOne({ user: id })
                .select("biodata_status approved_data")
                .lean();
            const approved = (bio === null || bio === void 0 ? void 0 : bio.biodata_status) === "approved" || Boolean(bio === null || bio === void 0 ? void 0 : bio.approved_data);
            if ((current === null || current === void 0 ? void 0 : current.user_status) !== "inactive" || !approved) {
                throw new ApiError_1.default(403, "Your biodata must be approved before it can be activated");
            }
        }
        const userInfo = { user_status };
        const updatedUserInfo = yield user_info_services_1.UserInfoService.updateUserInfo(id, userInfo);
        if (!updatedUserInfo) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "User info not found",
            });
        }
        mailStatusChange(updatedUserInfo, user_status, false);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "User status updated successfully",
        });
    })),
    updateUserInfoByAdmin: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const bioId = req.params.bioId;
        if (!id) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const userInfo = req.body;
        const updatedUserInfo = yield user_info_services_1.UserInfoService.updateUserInfo(bioId, userInfo);
        if (!updatedUserInfo) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "User info not found",
            });
        }
        if (userInfo === null || userInfo === void 0 ? void 0 : userInfo.user_status)
            mailStatusChange(updatedUserInfo, userInfo.user_status, true);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "User info updated successfully",
            data: updatedUserInfo,
        });
    })),
    verifyTokenByUser: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!id) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        res.json({
            success: true,
            data: req.user,
        });
    })),
    getAllUsersInfoId: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const userInfo = yield user_info_services_1.UserInfoService.getAllUsersInfoId();
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "All user info retrieved successfully",
            data: userInfo,
        });
    })),
    deleteUserInfo: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const id = req.params.id;
        yield user_info_services_1.UserInfoService.deleteUserInfo(id);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "User info deleted successfully",
        });
    })),
};
