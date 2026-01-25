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
exports.ReactionService = void 0;
const reactions_model_1 = __importDefault(require("./reactions.model"));
const mongoose_1 = __importDefault(require("mongoose"));
exports.ReactionService = {
    // Toggle reaction (create or update)
    toggleReaction(userId, bioUserId, reactionType) {
        return __awaiter(this, void 0, void 0, function* () {
            const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
            const bioUserObjectId = new mongoose_1.default.Types.ObjectId(bioUserId);
            const existingReaction = yield reactions_model_1.default.findOne({
                user: userObjectId,
                bio_user: bioUserObjectId,
            });
            // If same reaction exists, remove it (toggle off)
            if (existingReaction && existingReaction.reaction_type === reactionType) {
                yield reactions_model_1.default.deleteOne({ _id: existingReaction._id });
                return { message: "Reaction removed", reaction: null };
            }
            // If different reaction exists, update it
            if (existingReaction && existingReaction.reaction_type !== reactionType) {
                existingReaction.reaction_type = reactionType;
                yield existingReaction.save();
                return { message: "Reaction updated", reaction: existingReaction };
            }
            // Create new reaction
            const newReaction = yield reactions_model_1.default.create({
                user: userObjectId,
                bio_user: bioUserObjectId,
                reaction_type: reactionType,
            });
            return { message: "Reaction added", reaction: newReaction };
        });
    },
    // Get user's reaction for a specific biodata
    getUserReaction(userId, bioUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
            const bioUserObjectId = new mongoose_1.default.Types.ObjectId(bioUserId);
            return yield reactions_model_1.default.findOne({
                user: userObjectId,
                bio_user: bioUserObjectId,
            });
        });
    },
    // Get all biodatas the user reacted to with specific reaction type
    getMyReactionsList(userId, reactionType) {
        return __awaiter(this, void 0, void 0, function* () {
            const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
            const matchQuery = {
                user: userObjectId,
                bio_user: { $ne: userObjectId },
            };
            if (reactionType) {
                matchQuery.reaction_type = reactionType;
            }
            const results = yield reactions_model_1.default.aggregate([
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
        });
    },
    // Get all users who reacted to my biodata
    getReactionsToMyBiodata(bioUserId, reactionType) {
        return __awaiter(this, void 0, void 0, function* () {
            const bioUserObjectId = new mongoose_1.default.Types.ObjectId(bioUserId);
            const matchQuery = {
                bio_user: bioUserObjectId,
                user: { $ne: bioUserObjectId },
            };
            if (reactionType) {
                matchQuery.reaction_type = reactionType;
            }
            const results = yield reactions_model_1.default.aggregate([
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
        });
    },
    // Get reaction counts for a biodata
    getReactionCounts(bioUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            const bioUserObjectId = new mongoose_1.default.Types.ObjectId(bioUserId);
            const counts = yield reactions_model_1.default.aggregate([
                { $match: { bio_user: bioUserObjectId } },
                {
                    $group: {
                        _id: "$reaction_type",
                        count: { $sum: 1 },
                    },
                },
            ]);
            const reactionCounts = {
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
        });
    },
    // Get all reactions
    getAllReactions() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield reactions_model_1.default.find();
        });
    },
};
