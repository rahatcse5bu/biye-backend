import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { BioQuestionService } from "./bio_questions.service";
import GeneralInfo from "../general_info/general_info.model";
import { DefaultQuestionService, RELIGIONS, Religion } from "./bio_questions.defaults";

export const BioQuestionController = {
  // Get questions for a specific user (public - for buyers to see)
  getQuestionsByUser: catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId;

    const questions = await BioQuestionService.getQuestionsByUser(userId);

    if (!questions) {
      // Look up the user's religion from GeneralInfo
      const generalInfo = await GeneralInfo.findOne({ user: userId }).lean();
      const defaults = await DefaultQuestionService.forReligion((generalInfo as any)?.religion);

      return res.status(httpStatus.OK).json({
        success: true,
        message: "No custom questions set by this user",
        data: {
          isCustom: false,
          religion: defaults.religion,
          questions: defaults.questions,
        },
      });
    }

    res.status(httpStatus.OK).json({
      success: true,
      message: "Questions retrieved successfully",
      data: {
        ...questions,
        isCustom: true,
      },
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
      // Look up the current user's religion
      const generalInfo = await GeneralInfo.findOne({ user: userId.toString() }).lean();
      const defaults = await DefaultQuestionService.forReligion((generalInfo as any)?.religion);

      return res.status(httpStatus.OK).json({
        success: true,
        message: "No custom questions set",
        data: {
          isCustom: false,
          religion: defaults.religion,
          questions: defaults.questions,
        },
      });
    }

    res.status(httpStatus.OK).json({
      success: true,
      message: "Questions retrieved successfully",
      data: {
        ...questions,
        isCustom: true,
      },
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

  // TODO: admin view of the default question set for every religion.
  listDefaults: catchAsync(async (_req: Request, res: Response) => {
    res.status(httpStatus.OK).json({
      success: true,
      message: "Default questions retrieved successfully",
      data: await DefaultQuestionService.listAll(),
    });
  }),

  updateDefaults: catchAsync(async (req: Request, res: Response) => {
    const religion = req.params.religion as Religion;
    if (!(RELIGIONS as readonly string[]).includes(religion)) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "Unknown religion" });
    }
    const raw = Array.isArray(req.body?.questions) ? req.body.questions : [];
    const questions = raw
      .filter((q: unknown) => typeof q === "string")
      .map((q: string) => q.trim())
      .filter(Boolean);
    if (questions.length < 1 || questions.length > 10) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "Between 1 and 10 questions are required" });
    }
    if (questions.some((q: string) => q.length > 1000)) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "Each question must be 1000 characters or less" });
    }
    res.status(httpStatus.OK).json({
      success: true,
      message: "Default questions updated successfully",
      data: await DefaultQuestionService.update(religion, questions),
    });
  }),
};
