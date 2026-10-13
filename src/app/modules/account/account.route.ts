import { Request, Response, Router } from "express";
import httpStatus from "http-status";
import { Types } from "mongoose";
import { auth } from "../../middlewares/auth";
import catchAsync from "../../../shared/catchAsync";
import Favorite from "../favourites/favourites.model";
import UnFavorite from "../unfavorites/unfavorites.model";
import Reaction from "../reactions/reactions.model";
import Shortlist from "../shortlist/shortlist.model";
import BioChoice from "../bio_choice_data/bio_choice_data.model";
import Payment from "../payments/payment.model";
import ContactPurchase from "../contact_purchase_data/contact_purchase_data.model";
import { UserInfoModel } from "../user_info/user_info.model";
import BiodataRevision from "../biodata_revision/biodata_revision.model";
import { sectionByKey } from "../biodata_revision/biodata_revision.sections";

const router = Router();

// TODO: one round trip for every account-sidebar badge; keys match the sidebar paths.
router.get(
  "/sidebar-counts",
  auth("user", "admin"),
  catchAsync(async (req: Request, res: Response) => {
    const user = new Types.ObjectId(String(req.user?._id));
    const me: any = await UserInfoModel.findById(user).select("email").lean();

    const [reactions, likes, dislikes, shortlist, proposedTo, boughtFrom, bioRequestsPending, payments] =
      await Promise.all([
        Reaction.countDocuments({ user }),
        Favorite.countDocuments({ user }),
        UnFavorite.countDocuments({ user }),
        Shortlist.countDocuments({ user }),
        BioChoice.distinct("bio_user", { user, bio_user: { $ne: user } }),
        ContactPurchase.distinct("bio_user", { user }),
        BioChoice.countDocuments({ bio_user: user, status: "pending" }),
        me?.email ? Payment.countDocuments({ email: me.email }) : 0,
      ]);
    // TODO: same as the purchases page: proposals without a bought contact, plus bought contacts.
    const bought = new Set(boughtFrom.map(String));
    const purchases = proposedTo.filter((id) => !bought.has(String(id))).length + bought.size;

    res.status(httpStatus.OK).json({
      success: true,
      message: "Sidebar counts retrieved successfully",
      data: {
        reactions,
        likes,
        dislikes,
        shortlist,
        purchases,
        bio_requests_pending: bioRequestsPending,
        payments,
      },
    });
  }),
);

// TODO: edit-biodata step order (1-11); the review step (12) has no data of its own.
const STEP_SECTIONS = [
  "general_info", "address", "educational_qualification", "family_status", "personal_info", "occupation",
  "achievement", "marital_info", "expected_life_partner", "ongikar_nama", "contact",
];

// TODO: progress from what is actually saved, not edited_timeline_index (starts at 1, skipped by some sections, never decreases).
router.get(
  "/biodata-progress",
  auth("user", "admin"),
  catchAsync(async (req: Request, res: Response) => {
    const user = new Types.ObjectId(String(req.user?._id));
    const [exists, revision]: any[] = await Promise.all([
      Promise.all(STEP_SECTIONS.map((key) => sectionByKey(key)!.model.exists({ user }))),
      BiodataRevision.findOne({ user, status: { $in: ["draft", "pending"] } }).select("changes").lean(),
    ]);
    const completed = STEP_SECTIONS.map((key, index) => ({ step: index + 1, done: Boolean(exists[index]) || Boolean(revision?.changes?.[key]) }))
      .filter((s) => s.done)
      .map((s) => s.step);
    res.status(httpStatus.OK).json({ success: true, data: { completed, total: STEP_SECTIONS.length } });
  }),
);

export default router;
