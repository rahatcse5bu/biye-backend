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
const express_1 = require("express");
const http_status_1 = __importDefault(require("http-status"));
const auth_1 = require("../../middlewares/auth");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const bibahoMail_1 = require("../../../shared/bibahoMail");
const SendEmail_1 = require("../../../shared/SendEmail");
const email_settings_model_1 = require("./email_settings.model");
const emailTemplates_1 = require("../../../shared/emailTemplates");
const email_settings_service_1 = require("./email_settings.service");
const email_log_service_1 = require("../email_log/email_log.service");
const router = (0, express_1.Router)();
router.use((0, auth_1.auth)("admin"));
router.get("/", (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(http_status_1.default.OK).json({
        success: true,
        message: "Email settings retrieved successfully",
        data: yield email_settings_service_1.EmailSettingsService.get(),
    });
})));
router.patch("/", (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, error } = email_settings_service_1.EmailSettingsService.parse(req.body);
    if (error || !data) {
        res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: error });
        return;
    }
    res.status(http_status_1.default.OK).json({
        success: true,
        message: "Email settings updated successfully",
        data: yield email_settings_service_1.EmailSettingsService.update(data),
    });
})));
router.get("/usage", (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(http_status_1.default.OK).json({
        success: true,
        message: "Email usage retrieved successfully",
        data: yield email_log_service_1.EmailUsageService.getUsage(),
    });
})));
router.patch("/daily-limit", (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const limit = Number((_a = req.body) === null || _a === void 0 ? void 0 : _a.daily_limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100000) {
        res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: "Daily limit must be a whole number between 1 and 100000" });
        return;
    }
    res.status(http_status_1.default.OK).json({
        success: true,
        message: "Daily email limit updated",
        data: { daily_limit: yield email_log_service_1.EmailUsageService.setDailyLimit(limit) },
    });
})));
router.get("/templates", (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(http_status_1.default.OK).json({
        success: true,
        message: "Email templates retrieved successfully",
        data: emailTemplates_1.EMAIL_TEMPLATE_CATALOG.map(({ id, code, name, trigger, sample }) => ({
            id,
            code,
            name,
            trigger,
            subject: sample().subject,
            locked: email_settings_model_1.LOCKED_TEMPLATES.includes(id),
        })),
    });
})));
// TODO: renders a template with sample data and the unsaved branding so the admin can check before saving.
router.post("/preview", (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, error } = email_settings_service_1.EmailSettingsService.parse(req.body);
    if (error || !data) {
        res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: error });
        return;
    }
    const template = emailTemplates_1.EMAIL_TEMPLATE_CATALOG.find((item) => { var _a; return item.id === ((_a = req.body) === null || _a === void 0 ? void 0 : _a.template); }) || emailTemplates_1.EMAIL_TEMPLATE_CATALOG[0];
    const { subject, content } = template.sample();
    res.status(http_status_1.default.OK).json({ success: true, data: { html: (0, bibahoMail_1.renderEmail)(content, data), subject, template: template.id } });
})));
// TODO: sends the sample with the unsaved branding through the real SMTP account, so a bad setup shows up before users hit it.
router.post("/test", (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const to = typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.to) === "string" ? req.body.to.trim() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: "Enter a valid email address to send the test to" });
        return;
    }
    const { data, error } = email_settings_service_1.EmailSettingsService.parse(req.body);
    if (error || !data) {
        res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: error });
        return;
    }
    const template = emailTemplates_1.EMAIL_TEMPLATE_CATALOG.find((item) => { var _a; return item.id === ((_a = req.body) === null || _a === void 0 ? void 0 : _a.template); }) || emailTemplates_1.EMAIL_TEMPLATE_CATALOG[0];
    const { subject, content } = template.sample();
    try {
        yield (0, SendEmail_1.deliverEmail)(to, `[Test] ${subject} | Bibaho`, (0, bibahoMail_1.renderEmail)(content, data), {
            replyTo: data.support_email,
            fromName: data.sender_name,
        });
    }
    catch (sendError) {
        res.status(http_status_1.default.BAD_GATEWAY).json({
            success: false,
            message: `Mail server refused the test: ${String((sendError === null || sendError === void 0 ? void 0 : sendError.response) || (sendError === null || sendError === void 0 ? void 0 : sendError.message) || sendError).slice(0, 300)}`,
        });
        return;
    }
    res.status(http_status_1.default.OK).json({ success: true, message: `Test email sent to ${to}` });
})));
exports.default = router;
