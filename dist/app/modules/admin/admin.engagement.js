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
exports.EngagementController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const favourites_model_1 = __importDefault(require("../favourites/favourites.model"));
const shortlist_model_1 = __importDefault(require("../shortlist/shortlist.model"));
const reactions_model_1 = __importDefault(require("../reactions/reactions.model"));
const unfavorites_model_1 = __importDefault(require("../unfavorites/unfavorites.model"));
// TODO: all four collections share { user, bio_user, createdAt }: "user" acted on "bio_user"'s biodata.
const SOURCES = {
    favorites: favourites_model_1.default,
    shortlists: shortlist_model_1.default,
    reactions: reactions_model_1.default,
    dislikes: unfavorites_model_1.default,
};
const DAY = 24 * 60 * 60 * 1000;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const lookupUser = (from, as) => [
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
const getEngagement = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const model = SOURCES[req.params.type];
    if (!model) {
        return res.status(http_status_1.default.NOT_FOUND).json({ success: false, message: "Unknown engagement type" });
    }
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const search = String(req.query.search || "").trim().slice(0, 100);
    const reactionType = String(req.query.reaction_type || "");
    const baseMatch = {};
    if (req.params.type === "reactions" && /^[a-z]+$/.test(reactionType))
        baseMatch.reaction_type = reactionType;
    // TODO: a number searches either side's biodata no.; anything else searches either side's email.
    const searchMatch = [];
    if (/^\d+$/.test(search)) {
        searchMatch.push({ $or: [{ "member.user_id": Number(search) }, { "biodata.user_id": Number(search) }] });
    }
    else if (search) {
        const pattern = new RegExp(escapeRegex(search), "i");
        searchMatch.push({ $or: [{ "member.email": pattern }, { "biodata.email": pattern }] });
    }
    const [result] = yield model.aggregate([
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
    // TODO: stats ignore the filters so the totals and reaction chips always describe the whole type.
    const [stats] = yield model.aggregate([
        {
            $facet: Object.assign(Object.assign({ total: [{ $count: "count" }], last7: [{ $match: { createdAt: { $gte: new Date(Date.now() - 7 * DAY) } } }, { $count: "count" }] }, (req.params.type === "reactions"
                ? { byType: [{ $group: { _id: "$reaction_type", count: { $sum: 1 } } }, { $sort: { count: -1 } }] }
                : {})), { top: [
                    { $group: { _id: "$bio_user", count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 5 },
                    ...lookupUser("_id", "biodata"),
                    { $project: { _id: 0, count: 1, biodata: 1 } },
                ] }),
        },
    ]);
    const total = ((_b = (_a = result === null || result === void 0 ? void 0 : result.total) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.count) || 0;
    res.status(http_status_1.default.OK).json({
        success: true,
        data: (result === null || result === void 0 ? void 0 : result.items) || [],
        page,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
        stats: {
            total: ((_d = (_c = stats === null || stats === void 0 ? void 0 : stats.total) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.count) || 0,
            last7: ((_f = (_e = stats === null || stats === void 0 ? void 0 : stats.last7) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.count) || 0,
            byType: ((stats === null || stats === void 0 ? void 0 : stats.byType) || []).map((t) => ({ type: t._id, count: t.count })),
            top: (stats === null || stats === void 0 ? void 0 : stats.top) || [],
        },
    });
}));
exports.EngagementController = { getEngagement };
