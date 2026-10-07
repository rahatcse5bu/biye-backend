import express from "express";
import { auth } from "../../middlewares/auth";
import { BioQuestionController } from "./bio_questions.controller";
import validateRequest from "../../middlewares/validateRequest";
import { BioQuestionValidation } from "./bio_questions.validation";

const BioQuestionRouter = express.Router();

// Get questions for a specific user (public - for buyers)
BioQuestionRouter.route("/user/:userId").get(
  BioQuestionController.getQuestionsByUser
);

// Admin: default questions per religion (used until a user sets their own)
BioQuestionRouter.route("/defaults").get(
  auth("admin"),
  BioQuestionController.listDefaults
);
BioQuestionRouter.route("/defaults/:religion").put(
  auth("admin"),
  BioQuestionController.updateDefaults
);

// Get current user's own questions
BioQuestionRouter.route("/my-questions").get(
  auth("user", "admin"),
  BioQuestionController.getMyQuestions
);

// Create or update questions
BioQuestionRouter.route("/").post(
  auth("user", "admin"),
  validateRequest(BioQuestionValidation.upsertQuestions),
  BioQuestionController.upsertQuestions
);

// Delete questions
BioQuestionRouter.route("/").delete(
  auth("user", "admin"),
  BioQuestionController.deleteQuestions
);

export default BioQuestionRouter;
