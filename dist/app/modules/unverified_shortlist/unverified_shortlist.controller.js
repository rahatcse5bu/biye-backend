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
exports.UnverifiedShortlistController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const unverified_shortlist_model_1 = __importDefault(require("./unverified_shortlist.model"));
exports.UnverifiedShortlistController = {
    toggle: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const user = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { unverified_bio } = req.body;
        if (!user) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
        }
        if (!unverified_bio) {
            return res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: "unverified_bio is required" });
        }
        const existing = yield unverified_shortlist_model_1.default.findOne({ user, unverified_bio });
        if (existing) {
            yield unverified_shortlist_model_1.default.findOneAndDelete({ user, unverified_bio });
            return res.json({ success: true, message: "Shortlist removed.", data: { shortlisted: false } });
        }
        yield unverified_shortlist_model_1.default.create({ user, unverified_bio });
        return res.json({ success: true, message: "Shortlist added.", data: { shortlisted: true } });
    })),
    check: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        const user = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
        const { id } = req.params;
        if (!user) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
        }
        const exists = yield unverified_shortlist_model_1.default.findOne({ user, unverified_bio: id });
        return res.json({ success: true, data: { shortlisted: !!exists } });
    })),
    getMyShortlist: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _c;
        const user = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id;
        if (!user) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
        }
        const items = yield unverified_shortlist_model_1.default.find({ user })
            .populate("unverified_bio", "bio_id bio_type gender date_of_birth zilla religion is_active")
            .sort({ createdAt: -1 })
            .lean();
        return res.json({ success: true, data: items });
    })),
};
