import { Document, Types } from "mongoose";

export type NotificationAudience = "user" | "admin";
export type NotificationType =
  | "biodata"
  | "payment"
  | "refund"
  | "moderation"
  | "system";
// TODO: "important" pops up as a modal in the admin panel; use it only for work an admin must act on.
export type NotificationPriority = "normal" | "important";

export interface INotification extends Document {
  recipient?: Types.ObjectId | null;
  audience: NotificationAudience;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
