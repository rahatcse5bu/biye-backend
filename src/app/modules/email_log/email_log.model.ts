import mongoose, { Document, Schema } from "mongoose";

export interface IEmailLog extends Document {
  to: string;
  subject: string;
  status: "sent" | "failed";
  error?: string;
  limit_hit?: boolean;
  createdAt: Date;
}

// TODO: one row per outgoing email; the admin usage card counts these against Gmail's daily limit.
const EmailLogSchema = new Schema<IEmailLog>(
  {
    to: { type: String, required: true },
    subject: { type: String, default: "" },
    status: { type: String, enum: ["sent", "failed"], required: true },
    error: { type: String },
    limit_hit: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

EmailLogSchema.index({ status: 1, createdAt: -1 });
EmailLogSchema.index({ limit_hit: 1, createdAt: -1 }, { partialFilterExpression: { limit_hit: true } });

const EmailLog = mongoose.model<IEmailLog>("EmailLog", EmailLogSchema);

export default EmailLog;
