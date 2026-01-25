import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { ReactionService } from "./reactions.service";
import { ReactionType } from "./reactions.interface";

export const ReactionController = {
  // Toggle reaction
  toggleReaction: catchAsync(async (req: Request, res: Response) => {
    const user = req.user?._id;
    const { bio_user, reaction_type } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "You are not authorized",
      });
    }

    if (!bio_user || !reaction_type) {
      return res.status(400).json({
        success: false,
        message: "bio_user and reaction_type are required",
      });
    }

    const validReactions: ReactionType[] = ['like', 'dislike', 'love', 'sad', 'angry', 'wow'];
    if (!validReactions.includes(reaction_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reaction type",
      });
    }

    const result = await ReactionService.toggleReaction(
      String(user),
      bio_user,
      reaction_type
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: result.message,
      data: result.reaction,
    });
  }),

  // Get user's reaction for a biodata
  getUserReaction: catchAsync(async (req: Request, res: Response) => {
    const user = req.user?._id;
    const { bio_user } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "You are not authorized",
      });
    }

    const reaction = await ReactionService.getUserReaction(
      String(user),
      bio_user
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: "Reaction retrieved successfully",
      data: reaction,
    });
  }),

  // Get my reactions list (optionally filtered by type)
  getMyReactionsList: catchAsync(async (req: Request, res: Response) => {
    const user = req.user?._id;
    const { reaction_type } = req.query;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "You are not authorized",
      });
    }

    const reactions = await ReactionService.getMyReactionsList(
      String(user),
      reaction_type as ReactionType
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: "Reactions retrieved successfully",
      data: reactions,
    });
  }),

  // Get reactions to my biodata (optionally filtered by type)
  getReactionsToMyBiodata: catchAsync(async (req: Request, res: Response) => {
    const bioUser = req.user?._id;
    const { reaction_type } = req.query;

    if (!bioUser) {
      return res.status(401).json({
        success: false,
        message: "You are not authorized",
      });
    }

    const reactions = await ReactionService.getReactionsToMyBiodata(
      String(bioUser),
      reaction_type as ReactionType
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: "Reactions retrieved successfully",
      data: reactions,
    });
  }),

  // Get reaction counts for a biodata
  getReactionCounts: catchAsync(async (req: Request, res: Response) => {
    const { bio_user } = req.params;

    if (!bio_user) {
      return res.status(400).json({
        success: false,
        message: "bio_user is required",
      });
    }

    const counts = await ReactionService.getReactionCounts(bio_user);

    res.status(httpStatus.OK).json({
      success: true,
      message: "Reaction counts retrieved successfully",
      data: counts,
    });
  }),

  // Get all reactions (admin)
  getAllReactions: catchAsync(async (req: Request, res: Response) => {
    const reactions = await ReactionService.getAllReactions();

    res.status(httpStatus.OK).json({
      success: true,
      message: "All reactions retrieved successfully",
      data: reactions,
    });
  }),
};
