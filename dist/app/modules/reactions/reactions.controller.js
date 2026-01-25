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
exports.ReactionController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const reactions_service_1 = require("./reactions.service");
exports.ReactionController = {
    // Toggle reaction
    toggleReaction: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const user = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
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
        const validReactions = ['like', 'dislike', 'love', 'sad', 'angry', 'wow'];
        if (!validReactions.includes(reaction_type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid reaction type",
            });
        }
        const result = yield reactions_service_1.ReactionService.toggleReaction(String(user), bio_user, reaction_type);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: result.message,
            data: result.reaction,
        });
    })),
    // Get user's reaction for a biodata
    getUserReaction: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        const user = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
        const { bio_user } = req.params;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "You are not authorized",
            });
        }
        const reaction = yield reactions_service_1.ReactionService.getUserReaction(String(user), bio_user);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Reaction retrieved successfully",
            data: reaction,
        });
    })),
    // Get my reactions list (optionally filtered by type)
    getMyReactionsList: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _c;
        const user = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id;
        const { reaction_type } = req.query;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "You are not authorized",
            });
        }
        const reactions = yield reactions_service_1.ReactionService.getMyReactionsList(String(user), reaction_type);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Reactions retrieved successfully",
            data: reactions,
        });
    })),
    // Get reactions to my biodata (optionally filtered by type)
    getReactionsToMyBiodata: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _d;
        const bioUser = (_d = req.user) === null || _d === void 0 ? void 0 : _d._id;
        const { reaction_type } = req.query;
        if (!bioUser) {
            return res.status(401).json({
                success: false,
                message: "You are not authorized",
            });
        }
        const reactions = yield reactions_service_1.ReactionService.getReactionsToMyBiodata(String(bioUser), reaction_type);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Reactions retrieved successfully",
            data: reactions,
        });
    })),
    // Get reaction counts for a biodata
    getReactionCounts: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { bio_user } = req.params;
        if (!bio_user) {
            return res.status(400).json({
                success: false,
                message: "bio_user is required",
            });
        }
        const counts = yield reactions_service_1.ReactionService.getReactionCounts(bio_user);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Reaction counts retrieved successfully",
            data: counts,
        });
    })),
    // Get all reactions (admin)
    getAllReactions: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const reactions = yield reactions_service_1.ReactionService.getAllReactions();
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "All reactions retrieved successfully",
            data: reactions,
        });
    })),
};
