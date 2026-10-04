import { model, Schema } from "mongoose";
import { INotification } from "./notification.interface";

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    audience: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },
    type: {
      type: String,
      enum: ["biodata", "payment", "refund", "moderation", "system"],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String, trim: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, audience: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ audience: 1, isRead: 1, createdAt: -1 });

export const NotificationModel = model<INotification>(
  "Notification",
  notificationSchema,
);
