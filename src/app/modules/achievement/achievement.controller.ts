import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { AchievementService } from "./achievement.service";

export const AchievementController = {
  getAchievementByToken: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "You are not authorized",
      });
    }
    const achievement = await AchievementService.getAchievementByUser(userId);
    if (!achievement) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Achievement not found",
      });
    }
    res.status(httpStatus.OK).json({
      success: true,
      message: "Achievement retrieved successfully",
      data: achievement,
    });
  }),

  createAchievement: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "You are not authorized",
      });
    }
    const achievementData = { ...req.body, user: userId };
    const created = await AchievementService.createAchievement(achievementData);
    res.status(httpStatus.CREATED).json({
      success: true,
      message: "Achievement created successfully",
      data: created,
    });
  }),

  updateAchievement: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "You are not authorized",
      });
    }
    const updated = await AchievementService.updateAchievement(userId, req.body);
    if (!updated) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Achievement not found",
      });
    }
    res.status(httpStatus.OK).json({
      success: true,
      message: "Achievement updated successfully",
      data: updated,
    });
  }),
};
