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
const featured_request_service_1 = require("./featured_request.service");
const router = (0, express_1.Router)();
// TODO: public, so the site can show the price before login.
router.get("/settings", (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(http_status_1.default.OK).json({ success: true, data: yield featured_request_service_1.FeaturedRequestService.getSettings() });
})));
router.patch("/settings", (0, auth_1.auth)("admin"), (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, error } = featured_request_service_1.FeaturedRequestService.parseSettings(req.body);
    if (error || !data) {
        res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: error });
        return;
    }
    res.status(http_status_1.default.OK).json({
        success: true,
        message: "Featured settings updated",
        data: yield featured_request_service_1.FeaturedRequestService.updateSettings(data),
    });
})));
router.get("/me", (0, auth_1.auth)("user", "admin"), (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    res.status(http_status_1.default.OK).json({ success: true, data: yield featured_request_service_1.FeaturedRequestService.getMine(String((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) });
})));
router.post("/checkout", (0, auth_1.auth)("user", "admin"), (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c;
    res.status(http_status_1.default.OK).json({
        success: true,
        data: yield featured_request_service_1.FeaturedRequestService.startCheckout(String((_b = req.user) === null || _b === void 0 ? void 0 : _b._id), (_c = req.body) === null || _c === void 0 ? void 0 : _c.callbackURL),
    });
})));
router.get("/", (0, auth_1.auth)("admin"), (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield featured_request_service_1.FeaturedRequestService.listAll(req.query.status, req.query.page, req.query.limit);
    res.status(http_status_1.default.OK).json(Object.assign({ success: true }, result));
})));
router.post("/:id/approve", (0, auth_1.auth)("admin"), (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    res.status(http_status_1.default.OK).json({
        success: true,
        message: "Biodata featured",
        data: yield featured_request_service_1.FeaturedRequestService.approve(req.params.id, (_d = req.body) === null || _d === void 0 ? void 0 : _d.note),
    });
})));
router.post("/:id/reject", (0, auth_1.auth)("admin"), (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f;
    res.status(http_status_1.default.OK).json({
        success: true,
        message: "Request rejected",
        data: yield featured_request_service_1.FeaturedRequestService.reject(req.params.id, (_e = req.body) === null || _e === void 0 ? void 0 : _e.note, (_f = req.body) === null || _f === void 0 ? void 0 : _f.refund),
    });
})));
exports.default = router;
