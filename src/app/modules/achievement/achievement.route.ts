import express from "express";
import { AchievementController } from "./achievement.controller";
import { auth } from "../../middlewares/auth";

const AchievementRouter = express.Router();

AchievementRouter.route("/")
  .post(auth("user", "admin"), AchievementController.createAchievement)
  .put(auth("user", "admin"), AchievementController.updateAchievement);

AchievementRouter.route("/token").get(
  auth("user", "admin"),
  AchievementController.getAchievementByToken
);

export default AchievementRouter;
