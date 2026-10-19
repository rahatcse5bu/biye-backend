import { Request, Response } from "express";
import httpStatus from "http-status";
import { isValidObjectId } from "mongoose";
import catchAsync from "../../../shared/catchAsync";
import { IBlog } from "./blog.model";
import { BlogService } from "./blog.service";
import { hasText, sanitizeBlogHtml } from "./blog.sanitize";

const MAX_CONTENT_LENGTH = 300_000;

const optionalString = (value: unknown) =>
  typeof value === "string" ? value.trim() : undefined;

// TODO: returns cleaned fields or an error message; `partial` allows missing fields on update.
const parseInput = (
  body: any,
  partial: boolean,
): { data?: Partial<IBlog>; error?: string } => {
  const data: Partial<IBlog> = {};

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
    const content = sanitizeBlogHtml(body.content);
    if (!hasText(content)) return { error: "Content is required" };
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
  for (const key of ["slug", "excerpt", "author", "cover_image", "seo_title", "seo_description"] as const) {
    const value = optionalString(body[key]);
    if (value !== undefined) data[key] = value;
  }
  if ((data.seo_title?.length ?? 0) > 120) return { error: "SEO title must be 120 characters or fewer" };
  if ((data.seo_description?.length ?? 0) > 320) return { error: "SEO description must be 320 characters or fewer" };
  if (body.tags !== undefined) {
    const raw = Array.isArray(body.tags) ? body.tags : typeof body.tags === "string" ? body.tags.split(",") : null;
    if (!raw) return { error: "Tags must be a list" };
    // TODO: trimmed, de-duplicated case-insensitively, capped at 20 tags of 50 chars.
    const seen = new Set<string>();
    data.tags = raw
      .filter((tag: unknown): tag is string => typeof tag === "string")
      .map((tag: string) => tag.trim().replace(/^#/, "").slice(0, 50))
      .filter((tag: string) => tag && !seen.has(tag.toLowerCase()) && seen.add(tag.toLowerCase()))
      .slice(0, 20);
  }

  return { data };
};

const notFound = (res: Response) =>
  res.status(httpStatus.NOT_FOUND).json({ success: false, message: "Blog post not found" });

export const BlogController = {
  listPublished: catchAsync(async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
    const { data, total } = await BlogService.listPublished(page, limit);
    res.status(httpStatus.OK).json({
      success: true,
      message: "Blog posts retrieved successfully",
      data,
      meta: { page, limit, total },
    });
  }),

  getBySlug: catchAsync(async (req: Request, res: Response) => {
    const post = await BlogService.getPublishedBySlug(String(req.params.slug));
    if (!post) {
      notFound(res);
      return;
    }
    res.status(httpStatus.OK).json({
      success: true,
      message: "Blog post retrieved successfully",
      data: post,
    });
  }),

  listAll: catchAsync(async (_req: Request, res: Response) => {
    const posts = await BlogService.listAll();
    res.status(httpStatus.OK).json({
      success: true,
      message: "Blog posts retrieved successfully",
      data: posts,
    });
  }),

  create: catchAsync(async (req: Request, res: Response) => {
    const { data, error } = parseInput(req.body || {}, false);
    if (error) {
      res.status(httpStatus.BAD_REQUEST).json({ success: false, message: error });
      return;
    }
    const created = await BlogService.create(data!);
    res.status(httpStatus.CREATED).json({
      success: true,
      message: "Blog post created successfully",
      data: created,
    });
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    if (!isValidObjectId(req.params.id)) {
      notFound(res);
      return;
    }
    const { data, error } = parseInput(req.body || {}, true);
    if (error) {
      res.status(httpStatus.BAD_REQUEST).json({ success: false, message: error });
      return;
    }
    const updated = await BlogService.update(req.params.id, data!);
    if (!updated) {
      notFound(res);
      return;
    }
    res.status(httpStatus.OK).json({
      success: true,
      message: "Blog post updated successfully",
      data: updated,
    });
  }),

  remove: catchAsync(async (req: Request, res: Response) => {
    const deleted = isValidObjectId(req.params.id)
      ? await BlogService.remove(req.params.id)
      : null;
    if (!deleted) {
      notFound(res);
      return;
    }
    res.status(httpStatus.OK).json({ success: true, message: "Blog post deleted successfully" });
  }),
};
