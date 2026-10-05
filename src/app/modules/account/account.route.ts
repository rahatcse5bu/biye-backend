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

export default router;
