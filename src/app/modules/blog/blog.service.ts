import { randomUUID } from "crypto";
import Blog, { IBlog } from "./blog.model";

const publicFields = "title slug excerpt cover_image author published_at";

// TODO: keeps Unicode letters and marks so Bangla titles produce readable slugs; "admin" is reserved by the route.
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}\p{M}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);

const uniqueSlug = async (base: string, excludeId?: string) => {
  const root = slugify(base) || randomUUID().slice(0, 8);
  const isTaken = async (slug: string) =>
    slug === "admin" ||
    Boolean(await Blog.exists(excludeId ? { slug, _id: { $ne: excludeId } } : { slug }));
  let candidate = root;
  for (let n = 2; await isTaken(candidate); n += 1) {
    candidate = `${root}-${n}`;
  }
  return candidate;
};

// TODO: first publish stamps published_at; later edits keep the original date.
const withPublishDate = (data: Partial<IBlog>, current?: IBlog | null) => {
  if (data.status === "published" && !current?.published_at) {
    return { ...data, published_at: new Date() };
  }
  return data;
};

export const BlogService = {
  listPublished: async (page: number, limit: number) => {
    const filter = { status: "published" };
    const [data, total] = await Promise.all([
      Blog.find(filter)
        .sort({ published_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select(publicFields)
        .lean(),
      Blog.countDocuments(filter),
    ]);
    return { data, total };
  },

  getPublishedBySlug: async (slug: string) =>
    Blog.findOne({ slug, status: "published" })
      .select(`${publicFields} content updatedAt`)
      .lean(),

  listAll: async () => Blog.find().sort({ createdAt: -1 }).lean(),

  create: async (data: Partial<IBlog>) => {
    const slug = await uniqueSlug(data.slug || data.title || "");
    return (await Blog.create(withPublishDate({ ...data, slug }))).toObject();
  },

  update: async (id: string, data: Partial<IBlog>) => {
    const current = await Blog.findById(id);
    if (!current) return null;
    const next = { ...data };
    if (data.slug !== undefined) next.slug = await uniqueSlug(data.slug || current.title, id);
    return Blog.findByIdAndUpdate(id, withPublishDate(next, current), {
      new: true,
      runValidators: true,
    }).lean();
  },

  remove: async (id: string) => Blog.findByIdAndDelete(id).lean(),
};
