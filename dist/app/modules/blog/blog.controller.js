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
exports.BlogController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const mongoose_1 = require("mongoose");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const blog_service_1 = require("./blog.service");
const blog_sanitize_1 = require("./blog.sanitize");
const MAX_CONTENT_LENGTH = 300000;
const optionalString = (value) => typeof value === "string" ? value.trim() : undefined;
// TODO: returns cleaned fields or an error message; `partial` allows missing fields on update.
const parseInput = (body, partial) => {
    var _a, _b;
    var _c, _d;
    const data = {};
    if (body.title !== undefined || !partial) {
        if (typeof body.title !== "string" || !body.title.trim()) {
            return { error: "Title is required" };
        }
        data.title = body.title.trim();
    }
    if (body.content !== undefined || !partial) {
        if (typeof body.content !== "string" || body.content.length > MAX_CONTENT_LENGTH) {
            return { error: "Content is missing or too long" };
        }
        const content = (0, blog_sanitize_1.sanitizeBlogHtml)(body.content);
        if (!(0, blog_sanitize_1.hasText)(content))
            return { error: "Content is required" };
        data.content = content;
    }
    if (body.status !== undefined) {
        if (body.status !== "draft" && body.status !== "published") {
            return { error: "Status must be draft or published" };
        }
        data.status = body.status;
    }
    const cover = optionalString(body.cover_image);
    if (cover && !/^https:\/\//.test(cover)) {
        return { error: "Cover image must be an https URL" };
    }
    for (const key of ["slug", "excerpt", "author", "cover_image", "seo_title", "seo_description"]) {
        const value = optionalString(body[key]);
        if (value !== undefined)
            data[key] = value;
    }
    if (((_c = (_a = data.seo_title) === null || _a === void 0 ? void 0 : _a.length) !== null && _c !== void 0 ? _c : 0) > 120)
        return { error: "SEO title must be 120 characters or fewer" };
    if (((_d = (_b = data.seo_description) === null || _b === void 0 ? void 0 : _b.length) !== null && _d !== void 0 ? _d : 0) > 320)
        return { error: "SEO description must be 320 characters or fewer" };
    if (body.tags !== undefined) {
        const raw = Array.isArray(body.tags) ? body.tags : typeof body.tags === "string" ? body.tags.split(",") : null;
        if (!raw)
            return { error: "Tags must be a list" };
        // TODO: trimmed, de-duplicated case-insensitively, capped at 20 tags of 50 chars.
        const seen = new Set();
        data.tags = raw
            .filter((tag) => typeof tag === "string")
            .map((tag) => tag.trim().replace(/^#/, "").slice(0, 50))
            .filter((tag) => tag && !seen.has(tag.toLowerCase()) && seen.add(tag.toLowerCase()))
            .slice(0, 20);
    }
    return { data };
};
const notFound = (res) => res.status(http_status_1.default.NOT_FOUND).json({ success: false, message: "Blog post not found" });
exports.BlogController = {
    listPublished: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
        const { data, total } = yield blog_service_1.BlogService.listPublished(page, limit);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Blog posts retrieved successfully",
            data,
            meta: { page, limit, total },
        });
    })),
    getBySlug: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const post = yield blog_service_1.BlogService.getPublishedBySlug(String(req.params.slug));
        if (!post) {
            notFound(res);
            return;
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Blog post retrieved successfully",
            data: post,
        });
    })),
    listAll: (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const posts = yield blog_service_1.BlogService.listAll();
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Blog posts retrieved successfully",
            data: posts,
        });
    })),
    create: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { data, error } = parseInput(req.body || {}, false);
        if (error) {
            res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: error });
            return;
        }
        const created = yield blog_service_1.BlogService.create(data);
        res.status(http_status_1.default.CREATED).json({
            success: true,
            message: "Blog post created successfully",
            data: created,
        });
    })),
    update: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        if (!(0, mongoose_1.isValidObjectId)(req.params.id)) {
            notFound(res);
            return;
        }
        const { data, error } = parseInput(req.body || {}, true);
        if (error) {
            res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: error });
            return;
        }
        const updated = yield blog_service_1.BlogService.update(req.params.id, data);
        if (!updated) {
            notFound(res);
            return;
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Blog post updated successfully",
            data: updated,
        });
    })),
    remove: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const deleted = (0, mongoose_1.isValidObjectId)(req.params.id)
            ? yield blog_service_1.BlogService.remove(req.params.id)
            : null;
        if (!deleted) {
            notFound(res);
            return;
        }
        res.status(http_status_1.default.OK).json({ success: true, message: "Blog post deleted successfully" });
    })),
};
