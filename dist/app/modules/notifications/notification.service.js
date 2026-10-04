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
exports.NotificationService = void 0;
const mongoose_1 = require("mongoose");
const ably_1 = __importDefault(require("ably"));
const config_1 = __importDefault(require("../../../config"));
const notification_model_1 = require("./notification.model");
const ably = config_1.default.ably_api_key ? new ably_1.default.Rest(config_1.default.ably_api_key) : null;
const getChannelName = (notification) => {
    if (notification.audience === "admin")
        return "notifications:admins";
    return `notifications:user:${String(notification.recipient)}`;
};
const getActorFilter = (actor) => {
    if (actor.user_role === "admin") {
        return { audience: "admin" };
    }
    return {
        audience: "user",
        recipient: new mongoose_1.Types.ObjectId(String(actor._id)),
    };
};
exports.NotificationService = {
    create: (input) => __awaiter(void 0, void 0, void 0, function* () {
        const notification = yield notification_model_1.NotificationModel.create(input);
        yield exports.NotificationService.publish(notification);
        return notification;
    }),
    publish: (notification) => __awaiter(void 0, void 0, void 0, function* () {
        if (!ably)
            return;
        try {
            yield ably.channels.get(getChannelName(notification)).publish("notification", {
                id: String(notification._id || ""),
                audience: notification.audience,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                link: notification.link,
                createdAt: "createdAt" in notification ? notification.createdAt : new Date(),
            });
        }
        catch (error) {
            console.error("Notification realtime publish failed:", error);
        }
    }),
    requestToken: (actor) => __awaiter(void 0, void 0, void 0, function* () {
        if (!ably)
            return null;
        const channel = actor.user_role === "admin"
            ? "notifications:admins"
            : `notifications:user:${String(actor._id)}`;
        return ably.auth.requestToken({
            clientId: String(actor._id),
            capability: JSON.stringify({ [channel]: ["subscribe"] }),
            ttl: 60 * 60 * 1000,
        });
    }),
    listForActor: (actor, limit = 30) => __awaiter(void 0, void 0, void 0, function* () {
        const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);
        return notification_model_1.NotificationModel.find(getActorFilter(actor))
            .sort({ createdAt: -1 })
            .limit(safeLimit)
            .lean();
    }),
    getUnreadCount: (actor) => __awaiter(void 0, void 0, void 0, function* () {
        return notification_model_1.NotificationModel.countDocuments(Object.assign(Object.assign({}, getActorFilter(actor)), { isRead: false }));
    }),
    markRead: (id, actor) => __awaiter(void 0, void 0, void 0, function* () {
        return notification_model_1.NotificationModel.findOneAndUpdate(Object.assign({ _id: id }, getActorFilter(actor)), { isRead: true, readAt: new Date() }, { new: true }).lean();
    }),
    markAllRead: (actor) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield notification_model_1.NotificationModel.updateMany(Object.assign(Object.assign({}, getActorFilter(actor)), { isRead: false }), { isRead: true, readAt: new Date() });
        return { modifiedCount: result.modifiedCount };
    }),
};
