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
exports.PaymentController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const payments_service_1 = require("./payments.service");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const user_info_model_1 = require("../user_info/user_info.model");
exports.PaymentController = {
    getAllPayments: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const payments = yield payments_service_1.PaymentService.getAllPayments();
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "All payments retrieved successfully",
            data: payments,
        });
    })),
    getPaymentById: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const id = req.params.id;
        const payment = yield payments_service_1.PaymentService.getPaymentById(id);
        if (!payment) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "Payment not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "Payment retrieved successfully",
                data: payment,
            });
        }
    })),
    getPaymentByToken: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const user = yield user_info_model_1.UserInfoModel.findById(userId).lean();
        if (!user) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.NOT_FOUND,
                message: "User not found",
                success: false,
            });
        }
        const email = user.email;
        const payment = yield payments_service_1.PaymentService.getPaymentByEmail(email);
        if (!payment) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "Payment not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "Payment retrieved successfully",
                data: payment,
            });
        }
    })),
    createPayment: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        let paymentData = req.body;
        // Create payment
        const createdPayment = yield payments_service_1.PaymentService.createPayment(paymentData);
        res.status(http_status_1.default.CREATED).json({
            success: true,
            message: "Payment created successfully",
            data: createdPayment,
        });
    })),
    updatePayment: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        const id = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
        if (!id) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const updatedFields = req.body;
        const updatedPayment = yield payments_service_1.PaymentService.updatePayment(id, updatedFields);
        if (!updatedPayment) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "Payment not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "Payment updated successfully",
                data: updatedPayment,
            });
        }
    })),
    deletePayment: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const id = req.params.id;
        yield payments_service_1.PaymentService.deletePayment(id);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Payment deleted successfully",
        });
    })),
};
