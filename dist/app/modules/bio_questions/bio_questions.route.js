"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/auth");
const bio_questions_controller_1 = require("./bio_questions.controller");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const bio_questions_validation_1 = require("./bio_questions.validation");
const BioQuestionRouter = express_1.default.Router();
// Get questions for a specific user (public - for buyers)
BioQuestionRouter.route("/user/:userId").get(bio_questions_controller_1.BioQuestionController.getQuestionsByUser);
// Get current user's own questions
BioQuestionRouter.route("/my-questions").get((0, auth_1.auth)("user", "admin"), bio_questions_controller_1.BioQuestionController.getMyQuestions);
// Create or update questions
BioQuestionRouter.route("/").post((0, auth_1.auth)("user", "admin"), (0, validateRequest_1.default)(bio_questions_validation_1.BioQuestionValidation.upsertQuestions), bio_questions_controller_1.BioQuestionController.upsertQuestions);
// Delete questions
BioQuestionRouter.route("/").delete((0, auth_1.auth)("user", "admin"), bio_questions_controller_1.BioQuestionController.deleteQuestions);
exports.default = BioQuestionRouter;
