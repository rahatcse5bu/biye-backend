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
exports.RefundRequestController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const bkash_refund_1 = require("../bkash/bkash.refund");
const refund_request_service_1 = require("./refund_request.service");
// TODO: turns RefundError into its status + message; anything else goes to the global handler.
const handle = (fn) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield fn(req, res);
    }
    catch (error) {
        if (error instanceof bkash_refund_1.RefundError) {
            res.status(error.statusCode).json({ success: false, message: error.message });
            return;
        }
        next(error);
    }
});
exports.RefundRequestController = {
    create: handle((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        const request = yield refund_request_service_1.RefundRequestService.create(String((_a = req.user) === null || _a === void 0 ? void 0 : _a._id), (_b = req.body) === null || _b === void 0 ? void 0 : _b.payment_id, (_c = req.body) === null || _c === void 0 ? void 0 : _c.reason);
        res.status(http_status_1.default.CREATED).json({
            success: true,
            message: "Refund request submitted",
            data: request,
        });
    })),
    listMine: handle((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _d;
        const requests = yield refund_request_service_1.RefundRequestService.listForUser(String((_d = req.user) === null || _d === void 0 ? void 0 : _d._id));
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Refund requests retrieved successfully",
            data: requests,
        });
    })),
    listAll: handle((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const requests = yield refund_request_service_1.RefundRequestService.listAll(typeof req.query.status === "string" ? req.query.status : undefined);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Refund requests retrieved successfully",
            data: requests,
        });
    })),
    approve: handle((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield refund_request_service_1.RefundRequestService.approve(req.params.id);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Refund completed",
            data: result,
        });
    })),
    reject: handle((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _e;
        const request = yield refund_request_service_1.RefundRequestService.reject(req.params.id, (_e = req.body) === null || _e === void 0 ? void 0 : _e.note);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Refund request rejected and points returned",
            data: request,
        });
    })),
};
