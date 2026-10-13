import mongoose, { Document, Schema, Types } from "mongoose";

export const REVISION_STATUSES = ["draft", "pending", "approved", "rejected", "withdrawn"] as const;
export type RevisionStatus = (typeof REVISION_STATUSES)[number];
export const OPEN_STATUSES: RevisionStatus[] = ["draft", "pending"];

// TODO: section key -> { field: value }; only fields that differ from the live (published) biodata.
export type SectionChanges = Record<string, Record<string, unknown>>;

export interface IBiodataRevision extends Document {
  user: Types.ObjectId;
  status: RevisionStatus;
  changes: SectionChanges;
  // TODO: live values of the changed fields, frozen when an admin decides, so history keeps the before/after.
  previous?: SectionChanges | null;
  submitted_at?: Date | null;
  reviewed_at?: Date | null;
  reviewed_by?: Types.ObjectId | null;
  admin_note?: string;
  createdAt: Date;
  updatedAt: Date;
}

// TODO: every edit to a published biodata lands here; admins approve (applied to the live sections) or reject it.
const BiodataRevisionSchema = new Schema<IBiodataRevision>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: REVISION_STATUSES, default: "draft", index: true },
    changes: { type: Schema.Types.Mixed, default: {} },
    previous: { type: Schema.Types.Mixed, default: null },
    submitted_at: { type: Date, default: null },
    reviewed_at: { type: Date, default: null },
    reviewed_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    admin_note: { type: String, trim: true, default: "" },
  },
  { timestamps: true, minimize: false },
);

// TODO: at most one open (draft or pending) revision per user.
BiodataRevisionSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { status: { $in: OPEN_STATUSES } }, name: "one_open_revision_per_user" },
);
BiodataRevisionSchema.index({ status: 1, submitted_at: -1 });

const BiodataRevision = mongoose.model<IBiodataRevision>("BiodataRevision", BiodataRevisionSchema);

export default BiodataRevision;
