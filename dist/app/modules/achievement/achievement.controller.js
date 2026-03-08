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
exports.AchievementController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const achievement_service_1 = require("./achievement.service");
exports.AchievementController = {
    getAchievementByToken: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                success: false,
                message: "You are not authorized",
            });
        }
        const achievement = yield achievement_service_1.AchievementService.getAchievementByUser(userId);
        if (!achievement) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "Achievement not found",
            });
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Achievement retrieved successfully",
            data: achievement,
        });
    })),
    createAchievement: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                success: false,
                message: "You are not authorized",
            });
        }
        const achievementData = Object.assign(Object.assign({}, req.body), { user: userId });
        const created = yield achievement_service_1.AchievementService.createAchievement(achievementData);
        res.status(http_status_1.default.CREATED).json({
            success: true,
            message: "Achievement created successfully",
            data: created,
        });
    })),
    updateAchievement: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _c;
        const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                success: false,
                message: "You are not authorized",
            });
        }
        const updated = yield achievement_service_1.AchievementService.updateAchievement(userId, req.body);
        if (!updated) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "Achievement not found",
            });
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Achievement updated successfully",
            data: updated,
        });
    })),
};
