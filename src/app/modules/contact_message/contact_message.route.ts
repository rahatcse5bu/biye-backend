import express, { Request, Response } from "express";
import httpStatus from "http-status";
import { isValidObjectId } from "mongoose";
import catchAsync from "../../../shared/catchAsync";
import { auth } from "../../middlewares/auth";
import ContactMessage, { CONTACT_MESSAGE_STATUSES } from "./contact_message.model";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const router = express.Router();

router.use(auth("admin"));

router.get(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const status = String(req.query.status || "");
    const search = String(req.query.search || "").trim().slice(0, 100);

    const filter: Record<string, unknown> = {};
    if ((CONTACT_MESSAGE_STATUSES as readonly string[]).includes(status)) filter.status = status;
    if (search) {
      const pattern = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }, { bio: pattern }, { message: pattern }];
    }

    const [items, total] = await Promise.all([
      ContactMessage.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ContactMessage.countDocuments(filter),
    ]);

    res.status(httpStatus.OK).json({
      success: true,
      data: items,
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  }),
);

router.get(
  "/unread-count",
  catchAsync(async (_req: Request, res: Response) => {
    const count = await ContactMessage.countDocuments({ status: "new" });
    res.status(httpStatus.OK).json({ success: true, data: { count } });
  }),
);

router.patch(
  "/:id",
  catchAsync(async (req: Request, res: Response) => {
    const { status } = req.body || {};
    if (!isValidObjectId(req.params.id) || !(CONTACT_MESSAGE_STATUSES as readonly string[]).includes(status)) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "Invalid message or status" });
    }
    const updated = await ContactMessage.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean();
    if (!updated) {
      return res.status(httpStatus.NOT_FOUND).json({ success: false, message: "Message not found" });
    }
    res.status(httpStatus.OK).json({ success: true, data: updated });
  }),
);

router.delete(
  "/:id",
  catchAsync(async (req: Request, res: Response) => {
    if (!isValidObjectId(req.params.id)) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "Invalid message" });
    }
    const deleted = await ContactMessage.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
      return res.status(httpStatus.NOT_FOUND).json({ success: false, message: "Message not found" });
    }
    res.status(httpStatus.OK).json({ success: true, message: "Message deleted" });
  }),
);

export default router;
