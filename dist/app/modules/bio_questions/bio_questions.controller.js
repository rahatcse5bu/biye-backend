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
exports.BioQuestionController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const bio_questions_service_1 = require("./bio_questions.service");
const general_info_model_1 = __importDefault(require("../general_info/general_info.model"));
const bio_questions_defaults_1 = require("./bio_questions.defaults");
exports.BioQuestionController = {
    // Get questions for a specific user (public - for buyers to see)
    getQuestionsByUser: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const userId = req.params.userId;
        const questions = yield bio_questions_service_1.BioQuestionService.getQuestionsByUser(userId);
        if (!questions) {
            // Look up the user's religion from GeneralInfo
            const generalInfo = yield general_info_model_1.default.findOne({ user: userId }).lean();
            const defaults = yield bio_questions_defaults_1.DefaultQuestionService.forReligion(generalInfo === null || generalInfo === void 0 ? void 0 : generalInfo.religion);
            return res.status(http_status_1.default.OK).json({
                success: true,
                message: "No custom questions set by this user",
                data: {
                    isCustom: false,
                    religion: defaults.religion,
                    questions: defaults.questions,
                },
            });
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Questions retrieved successfully",
            data: Object.assign(Object.assign({}, questions), { isCustom: true }),
        });
    })),
    // Get current user's own questions
    getMyQuestions: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const questions = yield bio_questions_service_1.BioQuestionService.getQuestionsByUser(userId.toString());
        if (!questions) {
            // Look up the current user's religion
            const generalInfo = yield general_info_model_1.default.findOne({ user: userId.toString() }).lean();
            const defaults = yield bio_questions_defaults_1.DefaultQuestionService.forReligion(generalInfo === null || generalInfo === void 0 ? void 0 : generalInfo.religion);
            return res.status(http_status_1.default.OK).json({
                success: true,
                message: "No custom questions set",
                data: {
                    isCustom: false,
                    religion: defaults.religion,
                    questions: defaults.questions,
                },
            });
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Questions retrieved successfully",
            data: Object.assign(Object.assign({}, questions), { isCustom: true }),
        });
    })),
    // Create or update user's questions
    upsertQuestions: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { questions } = req.body;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const result = yield bio_questions_service_1.BioQuestionService.upsertQuestions(userId.toString(), questions);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Questions updated successfully",
            data: result,
        });
    })),
    // Delete user's questions
    deleteQuestions: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const deleted = yield bio_questions_service_1.BioQuestionService.deleteQuestions(userId.toString());
        if (!deleted) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "No questions found to delete",
            });
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Questions deleted successfully",
        });
    })),
    // TODO: admin view of the default question set for every religion.
    listDefaults: (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Default questions retrieved successfully",
            data: yield bio_questions_defaults_1.DefaultQuestionService.listAll(),
        });
    })),
    updateDefaults: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const religion = req.params.religion;
        if (!bio_questions_defaults_1.RELIGIONS.includes(religion)) {
            return res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: "Unknown religion" });
        }
        const raw = Array.isArray((_a = req.body) === null || _a === void 0 ? void 0 : _a.questions) ? req.body.questions : [];
        const questions = raw
            .filter((q) => typeof q === "string")
            .map((q) => q.trim())
            .filter(Boolean);
        if (questions.length < 1 || questions.length > 10) {
            return res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: "Between 1 and 10 questions are required" });
        }
        if (questions.some((q) => q.length > 1000)) {
            return res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: "Each question must be 1000 characters or less" });
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Default questions updated successfully",
            data: yield bio_questions_defaults_1.DefaultQuestionService.update(religion, questions),
        });
    })),
};
