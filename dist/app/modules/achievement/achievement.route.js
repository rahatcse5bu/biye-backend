"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const achievement_controller_1 = require("./achievement.controller");
const auth_1 = require("../../middlewares/auth");
const AchievementRouter = express_1.default.Router();
AchievementRouter.route("/")
    .post((0, auth_1.auth)("user", "admin"), achievement_controller_1.AchievementController.createAchievement)
    .put((0, auth_1.auth)("user", "admin"), achievement_controller_1.AchievementController.updateAchievement);
AchievementRouter.route("/token").get((0, auth_1.auth)("user", "admin"), achievement_controller_1.AchievementController.getAchievementByToken);
exports.default = AchievementRouter;
