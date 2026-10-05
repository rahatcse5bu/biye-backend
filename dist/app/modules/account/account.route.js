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
const express_1 = require("express");
const http_status_1 = __importDefault(require("http-status"));
const mongoose_1 = require("mongoose");
const auth_1 = require("../../middlewares/auth");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const favourites_model_1 = __importDefault(require("../favourites/favourites.model"));
const unfavorites_model_1 = __importDefault(require("../unfavorites/unfavorites.model"));
const reactions_model_1 = __importDefault(require("../reactions/reactions.model"));
const shortlist_model_1 = __importDefault(require("../shortlist/shortlist.model"));
const bio_choice_data_model_1 = __importDefault(require("../bio_choice_data/bio_choice_data.model"));
const payment_model_1 = __importDefault(require("../payments/payment.model"));
const contact_purchase_data_model_1 = __importDefault(require("../contact_purchase_data/contact_purchase_data.model"));
const user_info_model_1 = require("../user_info/user_info.model");
const router = (0, express_1.Router)();
// TODO: one round trip for every account-sidebar badge; keys match the sidebar paths.
router.get("/sidebar-counts", (0, auth_1.auth)("user", "admin"), (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = new mongoose_1.Types.ObjectId(String((_a = req.user) === null || _a === void 0 ? void 0 : _a._id));
    const me = yield user_info_model_1.UserInfoModel.findById(user).select("email").lean();
    const [reactions, likes, dislikes, shortlist, proposedTo, boughtFrom, bioRequestsPending, payments] = yield Promise.all([
        reactions_model_1.default.countDocuments({ user }),
        favourites_model_1.default.countDocuments({ user }),
        unfavorites_model_1.default.countDocuments({ user }),
        shortlist_model_1.default.countDocuments({ user }),
        bio_choice_data_model_1.default.distinct("bio_user", { user, bio_user: { $ne: user } }),
        contact_purchase_data_model_1.default.distinct("bio_user", { user }),
        bio_choice_data_model_1.default.countDocuments({ bio_user: user, status: "pending" }),
        (me === null || me === void 0 ? void 0 : me.email) ? payment_model_1.default.countDocuments({ email: me.email }) : 0,
    ]);
    // TODO: same as the purchases page: proposals without a bought contact, plus bought contacts.
    const bought = new Set(boughtFrom.map(String));
    const purchases = proposedTo.filter((id) => !bought.has(String(id))).length + bought.size;
    res.status(http_status_1.default.OK).json({
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
})));
exports.default = router;
