import { Document, Types } from "mongoose";

export type NotificationAudience = "user" | "admin";
export type NotificationType =
  | "biodata"
  | "payment"
  | "refund"
  | "moderation"
  | "system";

export interface INotification extends Document {
  recipient?: Types.ObjectId | null;
  audience: NotificationAudience;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
