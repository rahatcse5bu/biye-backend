import mongoose, { Document, Schema } from "mongoose";

export type BlogStatus = "draft" | "published";

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  author: string;
  seo_title: string;
  seo_description: string;
  tags: string[];
  status: BlogStatus;
  published_at: Date | null;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    excerpt: { type: String, default: "", trim: true },
    content: { type: String, required: true },
    cover_image: { type: String, default: "", trim: true },
    author: { type: String, default: "", trim: true },
    // TODO: optional search-engine overrides; the page falls back to title and excerpt when empty.
    seo_title: { type: String, default: "", trim: true },
    seo_description: { type: String, default: "", trim: true },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    published_at: { type: Date, default: null },
  },
  { timestamps: true },
);

BlogSchema.index({ status: 1, published_at: -1 });
BlogSchema.index({ tags: 1 });

const Blog = mongoose.model<IBlog>("Blog", BlogSchema);

export default Blog;
