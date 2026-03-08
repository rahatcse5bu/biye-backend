import { IAchievement } from "./achievement.interface";
import Achievement from "./achievement.model";

export const AchievementService = {
  getAchievementByUser: async (userId: string): Promise<IAchievement | null> => {
    return await Achievement.findOne({ user: userId }).lean();
  },

  createAchievement: async (data: Partial<IAchievement>): Promise<IAchievement> => {
    const created = await Achievement.create(data);
    return created.toObject();
  },

  updateAchievement: async (
    userId: string,
    updatedFields: Partial<IAchievement>
  ): Promise<IAchievement | null> => {
    const updated = await Achievement.findOneAndUpdate(
      { user: userId },
      updatedFields,
      { new: true }
    );
    return updated ? updated.toObject() : null;
  },
};
