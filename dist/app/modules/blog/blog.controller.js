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
const MAX_CONTENT_LENGTH = 100000;
const optionalString = (value) => typeof value === "string" ? value.trim() : undefined;
// TODO: returns cleaned fields or an error message; `partial` allows missing fields on update.
const parseInput = (body, partial) => {
    const data = {};
    if (body.title !== undefined || !partial) {
        if (typeof body.title !== "string" || !body.title.trim()) {
            return { error: "Title is required" };
        }
        data.title = body.title.trim();
    }
    if (body.content !== undefined || !partial) {
        if (typeof body.content !== "string" || !body.content.trim()) {
            return { error: "Content is required" };
        }
        if (body.content.length > MAX_CONTENT_LENGTH) {
            return { error: "Content is too long" };
        }
        data.content = body.content.trim();
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
    for (const key of ["slug", "excerpt", "author", "cover_image"]) {
        const value = optionalString(body[key]);
        if (value !== undefined)
            data[key] = value;
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
