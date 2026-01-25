"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactionRoutes = void 0;
const express_1 = __importDefault(require("express"));
const reactions_controller_1 = require("./reactions.controller");
const auth_1 = require("../../middlewares/auth");
const router = express_1.default.Router();
// Toggle reaction (add, update, or remove)
router.post("/toggle", (0, auth_1.auth)(), reactions_controller_1.ReactionController.toggleReaction);
// Get user's reaction for a specific biodata
router.get("/user-reaction/:bio_user", (0, auth_1.auth)(), reactions_controller_1.ReactionController.getUserReaction);
// Get my reactions list (with optional type filter)
router.get("/my-reactions", (0, auth_1.auth)(), reactions_controller_1.ReactionController.getMyReactionsList);
// Get reactions to my biodata (with optional type filter)
router.get("/reactions-to-me", (0, auth_1.auth)(), reactions_controller_1.ReactionController.getReactionsToMyBiodata);
// Get reaction counts for a biodata
router.get("/counts/:bio_user", reactions_controller_1.ReactionController.getReactionCounts);
// Get all reactions (admin)
router.get("/all", (0, auth_1.auth)(), reactions_controller_1.ReactionController.getAllReactions);
exports.ReactionRoutes = router;
