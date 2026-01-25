import Reaction from "./reactions.model";
import { IReaction, ReactionType } from "./reactions.interface";
import mongoose from "mongoose";

export const ReactionService = {
  // Toggle reaction (create or update)
  async toggleReaction(
    userId: string,
    bioUserId: string,
    reactionType: ReactionType
  ): Promise<{ message: string; reaction: IReaction | null }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const bioUserObjectId = new mongoose.Types.ObjectId(bioUserId);

    const existingReaction = await Reaction.findOne({
      user: userObjectId,
      bio_user: bioUserObjectId,
    });

    // If same reaction exists, remove it (toggle off)
    if (existingReaction && existingReaction.reaction_type === reactionType) {
      await Reaction.deleteOne({ _id: existingReaction._id });
      return { message: "Reaction removed", reaction: null };
    }

    // If different reaction exists, update it
    if (existingReaction && existingReaction.reaction_type !== reactionType) {
      existingReaction.reaction_type = reactionType;
      await existingReaction.save();
      return { message: "Reaction updated", reaction: existingReaction };
    }

    // Create new reaction
    const newReaction = await Reaction.create({
      user: userObjectId,
      bio_user: bioUserObjectId,
      reaction_type: reactionType,
    });

    return { message: "Reaction added", reaction: newReaction };
  },

  // Get user's reaction for a specific biodata
  async getUserReaction(
    userId: string,
    bioUserId: string
  ): Promise<IReaction | null> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const bioUserObjectId = new mongoose.Types.ObjectId(bioUserId);

    return await Reaction.findOne({
      user: userObjectId,
      bio_user: bioUserObjectId,
    });
  },

  // Get all biodatas the user reacted to with specific reaction type
  async getMyReactionsList(userId: string, reactionType?: ReactionType) {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const matchQuery: any = {
      user: userObjectId,
      bio_user: { $ne: userObjectId },
    };

    if (reactionType) {
      matchQuery.reaction_type = reactionType;
    }

    const results = await Reaction.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: "addresses",
          localField: "bio_user",
          foreignField: "user",
          as: "address",
        },
      },
      { $unwind: "$address" },
      {
        $lookup: {
          from: "users",
          localField: "bio_user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "generalinfos",
          localField: "bio_user",
          foreignField: "user",
          as: "general_info",
        },
      },
      { $unwind: "$general_info" },
      {
        $project: {
          bio_id: "$user.user_id",
          bio_user: "$address.user",
          permanent_address: "$address.permanent_address",
          date_of_birth: "$general_info.date_of_birth",
          screen_color: "$general_info.screen_color",
          reaction_type: 1,
        },
      },
    ]);

    return results;
  },

  // Get all users who reacted to my biodata
  async getReactionsToMyBiodata(bioUserId: string, reactionType?: ReactionType) {
    const bioUserObjectId = new mongoose.Types.ObjectId(bioUserId);

    const matchQuery: any = {
      bio_user: bioUserObjectId,
      user: { $ne: bioUserObjectId },
    };

    if (reactionType) {
      matchQuery.reaction_type = reactionType;
    }

    const results = await Reaction.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: "addresses",
          localField: "user",
          foreignField: "user",
          as: "address",
        },
      },
      { $unwind: "$address" },
      {
        $lookup: {
          from: "generalinfos",
          localField: "user",
          foreignField: "user",
          as: "general_info",
        },
      },
      { $unwind: "$general_info" },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          bio_id: "$user.user_id",
          bio_user: "$address.user",
          permanent_address: "$address.permanent_address",
          date_of_birth: "$general_info.date_of_birth",
          screen_color: "$general_info.screen_color",
          reaction_type: 1,
        },
      },
    ]);

    return results;
  },

  // Get reaction counts for a biodata
  async getReactionCounts(bioUserId: string) {
    const bioUserObjectId = new mongoose.Types.ObjectId(bioUserId);

    const counts = await Reaction.aggregate([
      { $match: { bio_user: bioUserObjectId } },
      {
        $group: {
          _id: "$reaction_type",
          count: { $sum: 1 },
        },
      },
    ]);

    const reactionCounts: Record<string, number> = {
      like: 0,
      dislike: 0,
      love: 0,
      sad: 0,
      angry: 0,
      wow: 0,
    };

    counts.forEach((item) => {
      reactionCounts[item._id] = item.count;
    });

    return reactionCounts;
  },

  // Get all reactions
  async getAllReactions() {
    return await Reaction.find();
  },
};
