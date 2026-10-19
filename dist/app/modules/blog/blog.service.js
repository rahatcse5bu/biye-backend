"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogService = exports.slugify = void 0;
const crypto_1 = require("crypto");
const blog_model_1 = __importDefault(require("./blog.model"));
const publicFields = "title slug excerpt cover_image author published_at";
// TODO: keeps Unicode letters and marks so Bangla titles produce readable slugs; "admin" is reserved by the route.
const slugify = (value) => value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}\p{M}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
exports.slugify = slugify;
const uniqueSlug = (base, excludeId) => __awaiter(void 0, void 0, void 0, function* () {
    const root = (0, exports.slugify)(base) || (0, crypto_1.randomUUID)().slice(0, 8);
    const isTaken = (slug) => __awaiter(void 0, void 0, void 0, function* () {
        return slug === "admin" ||
            Boolean(yield blog_model_1.default.exists(excludeId ? { slug, _id: { $ne: excludeId } } : { slug }));
    });
    let candidate = root;
    for (let n = 2; yield isTaken(candidate); n += 1) {
        candidate = `${root}-${n}`;
    }
    return candidate;
});
// TODO: first publish stamps published_at; later edits keep the original date.
const withPublishDate = (data, current) => {
    if (data.status === "published" && !(current === null || current === void 0 ? void 0 : current.published_at)) {
        return Object.assign(Object.assign({}, data), { published_at: new Date() });
    }
    return data;
};
exports.BlogService = {
    listPublished: (page, limit) => __awaiter(void 0, void 0, void 0, function* () {
        const filter = { status: "published" };
        const [data, total] = yield Promise.all([
            blog_model_1.default.find(filter)
                .sort({ published_at: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .select(publicFields)
                .lean(),
            blog_model_1.default.countDocuments(filter),
        ]);
        return { data, total };
    }),
    getPublishedBySlug: (slug) => __awaiter(void 0, void 0, void 0, function* () {
        return blog_model_1.default.findOne({ slug, status: "published" })
            .select(`${publicFields} content updatedAt`)
            .lean();
    }),
    listAll: () => __awaiter(void 0, void 0, void 0, function* () { return blog_model_1.default.find().sort({ createdAt: -1 }).lean(); }),
    create: (data) => __awaiter(void 0, void 0, void 0, function* () {
        const slug = yield uniqueSlug(data.slug || data.title || "");
        return (yield blog_model_1.default.create(withPublishDate(Object.assign(Object.assign({}, data), { slug })))).toObject();
    }),
    update: (id, data) => __awaiter(void 0, void 0, void 0, function* () {
        const current = yield blog_model_1.default.findById(id);
        if (!current)
            return null;
        const next = Object.assign({}, data);
        if (data.slug !== undefined)
            next.slug = yield uniqueSlug(data.slug || current.title, id);
        return blog_model_1.default.findByIdAndUpdate(id, withPublishDate(next, current), {
            new: true,
            runValidators: true,
        }).lean();
    }),
    remove: (id) => __awaiter(void 0, void 0, void 0, function* () { return blog_model_1.default.findByIdAndDelete(id).lean(); }),
};
