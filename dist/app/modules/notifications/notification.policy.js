"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canReadNotification = exports.usesAdminFeed = void 0;
const usesAdminFeed = (actor) => actor.scope === "admin" && actor.user_role === "admin";
exports.usesAdminFeed = usesAdminFeed;
const canReadNotification = (notification, actor) => {
    if (notification.audience === "admin") {
        return (0, exports.usesAdminFeed)(actor);
    }
    return (notification.audience === "user" &&
        !(0, exports.usesAdminFeed)(actor) &&
        notification.recipient != null &&
        String(notification.recipient) === String(actor._id));
};
exports.canReadNotification = canReadNotification;
