import express, { Request, Response } from "express";
import httpStatus from "http-status";
import { isValidObjectId } from "mongoose";
import catchAsync from "../../../shared/catchAsync";
import { auth } from "../../middlewares/auth";
import { REVISION_STATUSES } from "./biodata_revision.model";
import BiodataRevision from "./biodata_revision.model";
import { BiodataRevisionService } from "./biodata_revision.service";

const router = express.Router();

// TODO: member endpoints come first so "/me" is never read as an admin ":id".
router.get(
  "/me",
  auth("user", "admin"),
  catchAsync(async (req: Request, res: Response) => {
    res.status(httpStatus.OK).json({ success: true, data: await BiodataRevisionService.mine(req.user?._id) });
  }),
);

router.post(
  "/me/submit",
  auth("user", "admin"),
  catchAsync(async (req: Request, res: Response) => {
    await BiodataRevisionService.submit(req.user?._id);
    res.status(httpStatus.OK).json({
      success: true,
      message: "পরিবর্তনগুলো অনুমোদনের জন্য জমা দেওয়া হয়েছে",
      data: await BiodataRevisionService.mine(req.user?._id),
    });
  }),
);

router.delete(
  "/me",
  auth("user", "admin"),
  catchAsync(async (req: Request, res: Response) => {
    await BiodataRevisionService.withdraw(req.user?._id);
    res.status(httpStatus.OK).json({
      success: true,
      message: "পরিবর্তনগুলো বাতিল করা হয়েছে",
      data: await BiodataRevisionService.mine(req.user?._id),
    });
  }),
);

router.get(
  "/pending-count",
  auth("admin"),
  catchAsync(async (_req: Request, res: Response) => {
    const count = await BiodataRevision.countDocuments({ status: "pending" });
    res.status(httpStatus.OK).json({ success: true, data: { count } });
  }),
);

router.get(
  "/",
  auth("admin"),
  catchAsync(async (req: Request, res: Response) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const requested = String(req.query.status || "");
    const status = (REVISION_STATUSES as readonly string[]).includes(requested) && requested !== "draft" ? requested : undefined;
    const { items, total } = await BiodataRevisionService.list({ status, page, limit });
    res.status(httpStatus.OK).json({
      success: true,
      data: items,
      page,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  }),
);

router.get(
  "/:id",
  auth("admin"),
  catchAsync(async (req: Request, res: Response) => {
    if (!isValidObjectId(req.params.id)) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "Invalid change request" });
    }
    res.status(httpStatus.OK).json({ success: true, data: await BiodataRevisionService.detail(req.params.id) });
  }),
);

router.post(
  "/:id/approve",
  auth("admin"),
  catchAsync(async (req: Request, res: Response) => {
    if (!isValidObjectId(req.params.id)) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "Invalid change request" });
    }
    await BiodataRevisionService.approve(req.params.id, req.user?._id, req.body?.updatedAt);
    res.status(httpStatus.OK).json({ success: true, message: "Changes approved and published" });
  }),
);

router.post(
  "/:id/reject",
  auth("admin"),
  catchAsync(async (req: Request, res: Response) => {
    if (!isValidObjectId(req.params.id)) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "Invalid change request" });
    }
    const reason = String(req.body?.reason || "").trim().slice(0, 1000);
    await BiodataRevisionService.reject(req.params.id, req.user?._id, reason, req.body?.updatedAt);
    res.status(httpStatus.OK).json({ success: true, message: "Changes rejected" });
  }),
);

export default router;
