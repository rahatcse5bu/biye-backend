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
exports.NotificationController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const notification_service_1 = require("./notification.service");
const getActor = (req) => {
    var _a;
    if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || !req.user.user_role) {
        throw new Error("Authenticated user context is missing");
    }
    return {
        _id: req.user._id,
        user_role: String(req.user.user_role),
    };
};
exports.NotificationController = {
    ablyToken: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const tokenRequest = yield notification_service_1.NotificationService.requestToken(getActor(req));
        if (!tokenRequest) {
            return res.status(http_status_1.default.SERVICE_UNAVAILABLE).json({
                success: false,
                message: "Realtime notifications are not configured",
            });
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Realtime notification token created",
            data: tokenRequest,
        });
    })),
    list: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const notifications = yield notification_service_1.NotificationService.listForActor(getActor(req), Number(req.query.limit));
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Notifications retrieved successfully",
            data: notifications,
        });
    })),
    unreadCount: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const count = yield notification_service_1.NotificationService.getUnreadCount(getActor(req));
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Unread notification count retrieved successfully",
            data: { count },
        });
    })),
    markRead: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const notification = yield notification_service_1.NotificationService.markRead(req.params.id, getActor(req));
        if (!notification) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "Notification not found",
            });
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Notification marked as read",
            data: notification,
        });
    })),
    markAllRead: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield notification_service_1.NotificationService.markAllRead(getActor(req));
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Notifications marked as read",
            data: result,
        });
    })),
};
