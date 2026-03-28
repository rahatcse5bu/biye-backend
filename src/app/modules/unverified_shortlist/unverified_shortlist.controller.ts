import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import UnverifiedShortlist from "./unverified_shortlist.model";

export const UnverifiedShortlistController = {
  toggle: catchAsync(async (req: Request, res: Response) => {
    const user = req.user?._id;
    const { unverified_bio } = req.body;

    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
    }
    if (!unverified_bio) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "unverified_bio is required" });
    }

    const existing = await UnverifiedShortlist.findOne({ user, unverified_bio });

    if (existing) {
      await UnverifiedShortlist.findOneAndDelete({ user, unverified_bio });
      return res.json({ success: true, message: "Shortlist removed.", data: { shortlisted: false } });
    }

    await UnverifiedShortlist.create({ user, unverified_bio });
    return res.json({ success: true, message: "Shortlist added.", data: { shortlisted: true } });
  }),

  check: catchAsync(async (req: Request, res: Response) => {
    const user = req.user?._id;
    const { id } = req.params;

    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
    }

    const exists = await UnverifiedShortlist.findOne({ user, unverified_bio: id });
    return res.json({ success: true, data: { shortlisted: !!exists } });
  }),

  getMyShortlist: catchAsync(async (req: Request, res: Response) => {
    const user = req.user?._id;
    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
    }

    const items = await UnverifiedShortlist.find({ user })
      .populate("unverified_bio", "bio_id bio_type gender date_of_birth zilla religion is_active")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: items });
  }),
};
