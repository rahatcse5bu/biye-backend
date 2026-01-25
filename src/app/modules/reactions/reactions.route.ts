import express from "express";
import { ReactionController } from "./reactions.controller";
import { auth } from "../../middlewares/auth";

const router = express.Router();

// Toggle reaction (add, update, or remove)
router.post("/toggle", auth(), ReactionController.toggleReaction);

// Get user's reaction for a specific biodata
router.get("/user-reaction/:bio_user", auth(), ReactionController.getUserReaction);

// Get my reactions list (with optional type filter)
router.get("/my-reactions", auth(), ReactionController.getMyReactionsList);

// Get reactions to my biodata (with optional type filter)
router.get("/reactions-to-me", auth(), ReactionController.getReactionsToMyBiodata);

// Get reaction counts for a biodata
router.get("/counts/:bio_user", ReactionController.getReactionCounts);

// Get all reactions (admin)
router.get("/all", auth(), ReactionController.getAllReactions);

export const ReactionRoutes = router;
