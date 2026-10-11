import mongoose, { Document, Schema } from "mongoose";

export const CONTACT_MESSAGE_STATUSES = ["new", "read", "resolved"] as const;
export type ContactMessageStatus = (typeof CONTACT_MESSAGE_STATUSES)[number];

export interface IContactMessage extends Document {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: Date;
  updatedAt: Date;
}

// TODO: messages from the public "Contact us" form, read and resolved from the admin site.
const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 40, default: "" },
    bio: { type: String, trim: true, maxlength: 40, default: "" },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    status: { type: String, enum: CONTACT_MESSAGE_STATUSES, default: "new", index: true },
  },
  { timestamps: true },
);

ContactMessageSchema.index({ createdAt: -1 });

const ContactMessage = mongoose.model<IContactMessage>("ContactMessage", ContactMessageSchema);

export default ContactMessage;
