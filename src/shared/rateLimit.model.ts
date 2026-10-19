import { model, Schema } from "mongoose";

const rateLimitSchema = new Schema({
  _id: { type: String, required: true },
  hits: { type: Number, required: true },
  expires_at: { type: Date, required: true, index: { expires: 0 } },
});

export const RateLimitBucket = model("RateLimitBucket", rateLimitSchema);
