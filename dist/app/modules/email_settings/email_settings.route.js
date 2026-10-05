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
const email_settings_service_1 = require("./email_settings.service");
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
// TODO: renders a sample email from unsaved values so the admin can check before saving.
router.post("/preview", (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, error } = email_settings_service_1.EmailSettingsService.parse(req.body);
    if (error || !data) {
        res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: error });
        return;
    }
    const html = (0, bibahoMail_1.renderEmail)({
        title: "পয়েন্ট কেনা সফল হয়েছে",
        tone: "success",
        greeting: "প্রিয় সদস্য,",
        paragraphs: ["এটি একটি নমুনা ইমেইল। আপনার পরিবর্তিত লোগো ও ফুটার লিংক এভাবে দেখাবে।"],
        details: [
            { label: "পরিমাণ", value: "৳100" },
            { label: "যোগ হওয়া পয়েন্ট", value: 120 },
        ],
        action: { label: "ড্যাশবোর্ড দেখুন", path: "/user/account/dashboard" },
    }, data);
    res.status(http_status_1.default.OK).json({ success: true, data: { html } });
})));
exports.default = router;
