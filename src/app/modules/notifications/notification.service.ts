import { Types } from "mongoose";
import Ably from "ably";
import config from "../../../config";
import { NotificationModel } from "./notification.model";
import {
  INotification,
  NotificationAudience,
  NotificationType,
} from "./notification.interface";
import { NotificationActor } from "./notification.policy";

const ably = config.ably_api_key ? new Ably.Rest(config.ably_api_key) : null;

export interface CreateNotificationInput {
  recipient?: string | Types.ObjectId | null;
  audience: NotificationAudience;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

const getChannelName = (notification: CreateNotificationInput | INotification) => {
  if (notification.audience === "admin") return "notifications:admins";
  return `notifications:user:${String(notification.recipient)}`;
};

const getActorFilter = (actor: NotificationActor) => {
  if (actor.user_role === "admin") {
    return { audience: "admin" };
  }

  return {
    audience: "user",
    recipient: new Types.ObjectId(String(actor._id)),
  };
};

export const NotificationService = {
  create: async (input: CreateNotificationInput): Promise<INotification> => {
    const notification = await NotificationModel.create(input);
    await NotificationService.publish(notification);
    return notification;
  },

  publish: async (notification: CreateNotificationInput | INotification) => {
    if (!ably) return;

    try {
      await ably.channels.get(getChannelName(notification)).publish("notification", {
        id: String((notification as INotification)._id || ""),
        audience: notification.audience,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        createdAt: "createdAt" in notification ? notification.createdAt : new Date(),
      });
    } catch (error) {
      console.error("Notification realtime publish failed:", error);
    }
  },

  requestToken: async (actor: NotificationActor) => {
    if (!ably) return null;

    const channel =
      actor.user_role === "admin"
        ? "notifications:admins"
        : `notifications:user:${String(actor._id)}`;

    return ably.auth.requestToken({
      clientId: String(actor._id),
      capability: JSON.stringify({ [channel]: ["subscribe"] }),
      ttl: 60 * 60 * 1000,
    });
  },

  listForActor: async (actor: NotificationActor, limit = 30) => {
    const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);
    return NotificationModel.find(getActorFilter(actor))
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .lean();
  },

  getUnreadCount: async (actor: NotificationActor) => {
    return NotificationModel.countDocuments({
      ...getActorFilter(actor),
      isRead: false,
    });
  },

  markRead: async (id: string, actor: NotificationActor) => {
    return NotificationModel.findOneAndUpdate(
      { _id: id, ...getActorFilter(actor) },
      { isRead: true, readAt: new Date() },
      { new: true },
    ).lean();
  },

  markAllRead: async (actor: NotificationActor) => {
    const result = await NotificationModel.updateMany(
      { ...getActorFilter(actor), isRead: false },
      { isRead: true, readAt: new Date() },
    );
    return { modifiedCount: result.modifiedCount };
  },
};
