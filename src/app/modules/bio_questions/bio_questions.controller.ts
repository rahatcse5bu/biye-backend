import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { BioQuestionService } from "./bio_questions.service";

export const BioQuestionController = {
  // Get questions for a specific user (public - for buyers to see)
  getQuestionsByUser: catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId;

    const questions = await BioQuestionService.getQuestionsByUser(userId);

    if (!questions) {
      return res.status(httpStatus.OK).json({
        success: true,
        message: "No custom questions set by this user",
        data: {
          questions: [
            // Default questions if user hasn't set custom ones
            "মেয়েদের চোখ ঢাকা নিকাব পড়াকে অনেকে বাড়াবাড়ি মনে করে। ইসলাম তো সহজ, আপনি এব্যাপারে কি মনে করেন?",
            "প্রচন্ড বৃষ্টি হচ্ছে, মসজিদ যদিও কাছে মোটামুটি। হয়ত ছাতাও আছে যাওয়ার। কিন্তু ইসলাম তো সহজ, এখানে তো রুখসত আছে। কিন্তু অনেক অতি উৎসাহী আছে যারা এসব ঝড়-বৃষ্টি উপেক্ষা করেও যায় মসজিদে। এরকম বাড়াবাড়ি যারা করে তাদের ব্যাপারে আপনার মন্তব্য কি??",
            "ছেলেদের ইউনিভার্সিটিতে পড়াশুনা করার ব্যাপারে আপনার মতামত কি?",
            "অনেক দ্বীনদার মেয়ে ভার্সিটিতে পড়াশুনা করতে চায় এজন্য তাদের দ্বিনি পরিবেশ খুঁজে|শুরুতে জেনেশুনে মেয়েদের জন্য ভার্সিটিতে পড়তে চাওয়ার বিষয়ে আপনি কি মনে করেন??",
            "পর্দা করে অনলাইনে হিজাব নিকাবের ব্যাবসা তো হালাল।ভিডিও(মডেলিং) বানিয়ে তা দিয়ে একটা আউটসোর্সিং বা ব্যবসা করতে চাইলে আপনার থেকে কোনো হেল্প পেতে পারি? বা পারমিশন পেতে পারি?",
            "অমুক তার ছেলেকে ভার্সিটিতে ভর্তি হতে দিতে চায় না কারন ইসলামী পরিবেশ পাবে না। এরকম বাড়াবাড়ির ব্যাপারে আপনার মতামত কি?",
          ],
        },
      });
    }

    res.status(httpStatus.OK).json({
      success: true,
      message: "Questions retrieved successfully",
      data: questions,
    });
  }),

  // Get current user's own questions
  getMyQuestions: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const questions = await BioQuestionService.getQuestionsByUser(
      userId.toString()
    );

    if (!questions) {
      return res.status(httpStatus.OK).json({
        success: true,
        message: "No custom questions set",
        data: {
          questions: [
            // Default questions if user hasn't set custom ones
            "মেয়েদের চোখ ঢাকা নিকাব পড়াকে অনেকে বাড়াবাড়ি মনে করে। ইসলাম তো সহজ, আপনি এব্যাপারে কি মনে করেন?",
            "প্রচন্ড বৃষ্টি হচ্ছে, মসজিদ যদিও কাছে মোটামুটি। হয়ত ছাতাও আছে যাওয়ার। কিন্তু ইসলাম তো সহজ, এখানে তো রুখসত আছে। কিন্তু অনেক অতি উৎসাহী আছে যারা এসব ঝড়-বৃষ্টি উপেক্ষা করেও যায় মসজিদে। এরকম বাড়াবাড়ি যারা করে তাদের ব্যাপারে আপনার মন্তব্য কি??",
            "ছেলেদের ইউনিভার্সিটিতে পড়াশুনা করার ব্যাপারে আপনার মতামত কি?",
            "অনেক দ্বীনদার মেয়ে ভার্সিটিতে পড়াশুনা করতে চায় এজন্য তাদের দ্বিনি পরিবেশ খুঁজে|শুরুতে জেনেশুনে মেয়েদের জন্য ভার্সিটিতে পড়তে চাওয়ার বিষয়ে আপনি কি মনে করেন??",
            "পর্দা করে অনলাইনে হিজাব নিকাবের ব্যাবসা তো হালাল।ভিডিও(মডেলিং) বানিয়ে তা দিয়ে একটা আউটসোর্সিং বা ব্যবসা করতে চাইলে আপনার থেকে কোনো হেল্প পেতে পারি? বা পারমিশন পেতে পারি?",
            "অমুক তার ছেলেকে ভার্সিটিতে ভর্তি হতে দিতে চায় না কারন ইসলামী পরিবেশ পাবে না। এরকম বাড়াবাড়ির ব্যাপারে আপনার মতামত কি?",
          ],
        },
      });
    }

    res.status(httpStatus.OK).json({
      success: true,
      message: "Questions retrieved successfully",
      data: questions,
    });
  }),

  // Create or update user's questions
  upsertQuestions: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { questions } = req.body;

    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await BioQuestionService.upsertQuestions(
      userId.toString(),
      questions
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: "Questions updated successfully",
      data: result,
    });
  }),

  // Delete user's questions
  deleteQuestions: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const deleted = await BioQuestionService.deleteQuestions(
      userId.toString()
    );

    if (!deleted) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "No questions found to delete",
      });
    }

    res.status(httpStatus.OK).json({
      success: true,
      message: "Questions deleted successfully",
    });
  }),
};
