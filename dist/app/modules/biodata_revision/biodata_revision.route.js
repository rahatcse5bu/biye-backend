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
const express_1 = __importDefault(require("express"));
const http_status_1 = __importDefault(require("http-status"));
const mongoose_1 = require("mongoose");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const auth_1 = require("../../middlewares/auth");
const biodata_revision_model_1 = require("./biodata_revision.model");
const biodata_revision_model_2 = __importDefault(require("./biodata_revision.model"));
const biodata_revision_service_1 = require("./biodata_revision.service");
const router = express_1.default.Router();
// TODO: member endpoints come first so "/me" is never read as an admin ":id".
router.get("/me", (0, auth_1.auth)("user", "admin"), (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    res.status(http_status_1.default.OK).json({ success: true, data: yield biodata_revision_service_1.BiodataRevisionService.mine((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) });
})));
router.post("/me/submit", (0, auth_1.auth)("user", "admin"), (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    yield biodata_revision_service_1.BiodataRevisionService.submit((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
    res.status(http_status_1.default.OK).json({
        success: true,
        message: "পরিবর্তনগুলো অনুমোদনের জন্য জমা দেওয়া হয়েছে",
        data: yield biodata_revision_service_1.BiodataRevisionService.mine((_b = req.user) === null || _b === void 0 ? void 0 : _b._id),
    });
})));
router.delete("/me", (0, auth_1.auth)("user", "admin"), (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    yield biodata_revision_service_1.BiodataRevisionService.withdraw((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
    res.status(http_status_1.default.OK).json({
        success: true,
        message: "পরিবর্তনগুলো বাতিল করা হয়েছে",
        data: yield biodata_revision_service_1.BiodataRevisionService.mine((_b = req.user) === null || _b === void 0 ? void 0 : _b._id),
    });
})));
router.get("/pending-count", (0, auth_1.auth)("admin"), (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const count = yield biodata_revision_model_2.default.countDocuments({ status: "pending" });
    res.status(http_status_1.default.OK).json({ success: true, data: { count } });
})));
router.get("/", (0, auth_1.auth)("admin"), (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const requested = String(req.query.status || "");
    const status = biodata_revision_model_1.REVISION_STATUSES.includes(requested) && requested !== "draft" ? requested : undefined;
    const { items, total } = yield biodata_revision_service_1.BiodataRevisionService.list({ status, page, limit });
    res.status(http_status_1.default.OK).json({
        success: true,
        data: items,
        page,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
    });
})));
router.get("/:id", (0, auth_1.auth)("admin"), (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(0, mongoose_1.isValidObjectId)(req.params.id)) {
        return res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: "Invalid change request" });
    }
    res.status(http_status_1.default.OK).json({ success: true, data: yield biodata_revision_service_1.BiodataRevisionService.detail(req.params.id) });
})));
router.post("/:id/approve", (0, auth_1.auth)("admin"), (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!(0, mongoose_1.isValidObjectId)(req.params.id)) {
        return res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: "Invalid change request" });
    }
    yield biodata_revision_service_1.BiodataRevisionService.approve(req.params.id, (_a = req.user) === null || _a === void 0 ? void 0 : _a._id, (_b = req.body) === null || _b === void 0 ? void 0 : _b.updatedAt);
    res.status(http_status_1.default.OK).json({ success: true, message: "Changes approved and published" });
})));
router.post("/:id/reject", (0, auth_1.auth)("admin"), (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    if (!(0, mongoose_1.isValidObjectId)(req.params.id)) {
        return res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: "Invalid change request" });
    }
    const reason = String(((_a = req.body) === null || _a === void 0 ? void 0 : _a.reason) || "").trim().slice(0, 1000);
    yield biodata_revision_service_1.BiodataRevisionService.reject(req.params.id, (_b = req.user) === null || _b === void 0 ? void 0 : _b._id, reason, (_c = req.body) === null || _c === void 0 ? void 0 : _c.updatedAt);
    res.status(http_status_1.default.OK).json({ success: true, message: "Changes rejected" });
})));
exports.default = router;
