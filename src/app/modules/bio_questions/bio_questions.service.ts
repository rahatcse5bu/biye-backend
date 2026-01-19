import BioQuestion from "./bio_questions.model";
import { IBioQuestion } from "./bio_questions.interface";

export const BioQuestionService = {
  // Get user's questions
  getQuestionsByUser: async (userId: string): Promise<IBioQuestion | null> => {
    const questions = await BioQuestion.findOne({ user: userId }).lean();
    return questions;
  },

  // Create or update user's questions
  upsertQuestions: async (
    userId: string,
    questions: string[]
  ): Promise<IBioQuestion | null> => {
    const result = await BioQuestion.findOneAndUpdate(
      { user: userId },
      { user: userId, questions },
      { new: true, upsert: true }
    );
    return result ? result.toObject() : null;
  },

  // Delete user's questions
  deleteQuestions: async (userId: string): Promise<boolean> => {
    const result = await BioQuestion.deleteOne({ user: userId });
    return result.deletedCount > 0;
  },
};
