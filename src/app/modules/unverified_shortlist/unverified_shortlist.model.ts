import { Schema, model, Document } from "mongoose";

export interface IUnverifiedShortlist extends Document {
  user: Schema.Types.ObjectId;
  unverified_bio: Schema.Types.ObjectId;
}

const schema = new Schema<IUnverifiedShortlist>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    unverified_bio: { type: Schema.Types.ObjectId, ref: "UnverifiedBiodata", required: true },
  },
  { timestamps: true }
);

schema.index({ user: 1, unverified_bio: 1 }, { unique: true });

export default model<IUnverifiedShortlist>("UnverifiedShortlist", schema);
