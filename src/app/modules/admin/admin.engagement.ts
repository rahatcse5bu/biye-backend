import { Request, Response } from "express";
import httpStatus from "http-status";
import { Model } from "mongoose";
import catchAsync from "../../../shared/catchAsync";
import Favorite from "../favourites/favourites.model";
import Shortlist from "../shortlist/shortlist.model";
import Reaction from "../reactions/reactions.model";
import UnFavorite from "../unfavorites/unfavorites.model";

// TODO: all four collections share { user, bio_user, createdAt }: "user" acted on "bio_user"'s biodata.
const SOURCES: Record<string, Model<any>> = {
  favorites: Favorite,
  shortlists: Shortlist,
  reactions: Reaction,
  dislikes: UnFavorite,
};

const DAY = 24 * 60 * 60 * 1000;
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const lookupUser = (from: string, as: string) => [
  {
    $lookup: {
      from: "users",
      localField: from,
      foreignField: "_id",
      pipeline: [{ $project: { user_id: 1, email: 1, username: 1, user_status: 1 } }],
      as,
    },
  },
  { $set: { [as]: { $first: `$${as}` } } },
];

const getEngagement = catchAsync(async (req: Request, res: Response) => {
  const model = SOURCES[req.params.type];
  if (!model) {
    return res.status(httpStatus.NOT_FOUND).json({ success: false, message: "Unknown engagement type" });
  }

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const search = String(req.query.search || "").trim().slice(0, 100);
  const reactionType = String(req.query.reaction_type || "");

  const baseMatch: Record<string, unknown> = {};
  if (req.params.type === "reactions" && /^[a-z]+$/.test(reactionType)) baseMatch.reaction_type = reactionType;

  // TODO: a number searches either side's biodata no.; anything else searches either side's email.
  const searchMatch: Record<string, unknown>[] = [];
  if (/^\d+$/.test(search)) {
    searchMatch.push({ $or: [{ "member.user_id": Number(search) }, { "biodata.user_id": Number(search) }] });
  } else if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    searchMatch.push({ $or: [{ "member.email": pattern }, { "biodata.email": pattern }] });
  }

  const [result] = await model.aggregate([
    { $match: baseMatch },
    ...lookupUser("user", "member"),
    ...lookupUser("bio_user", "biodata"),
    ...searchMatch.map((m) => ({ $match: m })),
    {
      $facet: {
        items: [
          { $sort: { createdAt: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          { $project: { member: 1, biodata: 1, reaction_type: 1, createdAt: 1 } },
        ],
        total: [{ $count: "count" }],
      },
    },
  ]);

  const [stats] = await model.aggregate([
    { $match: baseMatch },
    {
      $facet: {
        total: [{ $count: "count" }],
        last7: [{ $match: { createdAt: { $gte: new Date(Date.now() - 7 * DAY) } } }, { $count: "count" }],
        byType: req.params.type === "reactions" ? [{ $group: { _id: "$reaction_type", count: { $sum: 1 } } }, { $sort: { count: -1 } }] : [],
        top: [
          { $group: { _id: "$bio_user", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
          ...lookupUser("_id", "biodata"),
          { $project: { _id: 0, count: 1, biodata: 1 } },
        ],
      },
    },
  ]);

  const total = result?.total?.[0]?.count || 0;
  res.status(httpStatus.OK).json({
    success: true,
    data: result?.items || [],
    page,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    stats: {
      total: stats?.total?.[0]?.count || 0,
      last7: stats?.last7?.[0]?.count || 0,
      byType: (stats?.byType || []).map((t: any) => ({ type: t._id, count: t.count })),
      top: stats?.top || [],
    },
  });
});

export const EngagementController = { getEngagement };
