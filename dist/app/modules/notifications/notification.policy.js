"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canReadNotification = void 0;
const canReadNotification = (notification, actor) => {
    if (notification.audience === "admin") {
        return actor.user_role === "admin";
    }
    return (notification.audience === "user" &&
        actor.user_role === "user" &&
        notification.recipient != null &&
        String(notification.recipient) === String(actor._id));
};
exports.canReadNotification = canReadNotification;
