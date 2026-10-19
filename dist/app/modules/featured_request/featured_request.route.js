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
const authCheck_1 = __importDefault(require("../../middlewares/authCheck"));
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
// TODO: authCheck loads the bKash base URL and token; without it a cold serverless instance calls "undefined/checkout/create".
router.post("/checkout", (0, auth_1.auth)("user", "admin"), authCheck_1.default, (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    res.status(http_status_1.default.OK).json({
        success: true,
        data: yield featured_request_service_1.FeaturedRequestService.startCheckout(String((_a = req.user) === null || _a === void 0 ? void 0 : _a._id), (_b = req.body) === null || _b === void 0 ? void 0 : _b.callbackURL),
    });
})));
// TODO: public so anonymous visitors count too; the service caps ids and only credits running paid periods.
router.post("/track", (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    yield featured_request_service_1.FeaturedRequestService.track((_a = req.body) === null || _a === void 0 ? void 0 : _a.biodata_ids, (_b = req.body) === null || _b === void 0 ? void 0 : _b.event);
    res.status(http_status_1.default.NO_CONTENT).end();
})));
router.get("/", (0, auth_1.auth)("admin"), (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield featured_request_service_1.FeaturedRequestService.listAll(req.query.status, req.query.page, req.query.limit);
    res.status(http_status_1.default.OK).json(Object.assign({ success: true }, result));
})));
router.post("/:id/approve", (0, auth_1.auth)("admin"), (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    res.status(http_status_1.default.OK).json({
        success: true,
        message: "Biodata featured",
        data: yield featured_request_service_1.FeaturedRequestService.approve(req.params.id, (_a = req.body) === null || _a === void 0 ? void 0 : _a.note),
    });
})));
router.post("/:id/reject", (0, auth_1.auth)("admin"), (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    res.status(http_status_1.default.OK).json({
        success: true,
        message: "Request rejected",
        data: yield featured_request_service_1.FeaturedRequestService.reject(req.params.id, (_a = req.body) === null || _a === void 0 ? void 0 : _a.note, (_b = req.body) === null || _b === void 0 ? void 0 : _b.refund),
    });
})));
exports.default = router;
