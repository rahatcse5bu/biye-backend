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
// Default questions by religion
const defaultQuestionsByReligion = {
    islam: [
        "মেয়েদের চোখ ঢাকা নিকাব পড়াকে অনেকে বাড়াবাড়ি মনে করে। ইসলাম তো সহজ, আপনি এব্যাপারে কি মনে করেন?",
        "প্রচন্ড বৃষ্টি হচ্ছে, মসজিদ যদিও কাছে মোটামুটি। হয়ত ছাতাও আছে যাওয়ার। কিন্তু ইসলাম তো সহজ, এখানে তো রুখসত আছে। কিন্তু অনেক অতি উৎসাহী আছে যারা এসব ঝড়-বৃষ্টি উপেক্ষা করেও যায় মসজিদে। এরকম বাড়াবাড়ি যারা করে তাদের ব্যাপারে আপনার মন্তব্য কি??",
        "ছেলেদের ইউনিভার্সিটিতে পড়াশুনা করার ব্যাপারে আপনার মতামত কি?",
        "অনেক দ্বীনদার মেয়ে ভার্সিটিতে পড়াশুনা করতে চায় এজন্য তাদের দ্বিনি পরিবেশ খুঁজে|শুরুতে জেনেশুনে মেয়েদের জন্য ভার্সিটিতে পড়তে চাওয়ার বিষয়ে আপনি কি মনে করেন??",
        "পর্দা করে অনলাইনে হিজাব নিকাবের ব্যাবসা তো হালাল।ভিডিও(মডেলিং) বানিয়ে তা দিয়ে একটা আউটসোর্সিং বা ব্যবসা করতে চাইলে আপনার থেকে কোনো হেল্প পেতে পারি? বা পারমিশন পেতে পারি?",
        "অমুক তার ছেলেকে ভার্সিটিতে ভর্তি হতে দিতে চায় না কারন ইসলামী পরিবেশ পাবে না। এরকম বাড়াবাড়ির ব্যাপারে আপনার মতামত কি?",
    ],
    hinduism: [
        "আপনার পরিবারে নিয়মিত পূজা-অর্চনা হয় কি?",
        "আপনি কি নিরামিষভোজী নাকি আমিষভোজী? জীবনসঙ্গীর খাদ্যাভ্যাস নিয়ে আপনার মতামত কি?",
        "বিবাহের ক্ষেত্রে জাতি/বর্ণ কতটা গুরুত্বপূর্ণ বলে আপনি মনে করেন?",
        "যৌতুক প্রথা সম্পর্কে আপনার মতামত কি?",
        "বিবাহের পর আপনি যৌথ পরিবারে থাকতে চান নাকি আলাদা?",
        "ধর্মীয় আচার-অনুষ্ঠান ও উৎসবে আপনি কতটা সক্রিয়?",
    ],
    christianity: [
        "আপনি নিয়মিত গির্জায় যান কি? কোন গির্জা/মণ্ডলীতে যোগ দেন?",
        "আপনার বিশ্বাসের ভিত্তি কি? বাইবেল পড়া ও প্রার্থনা আপনার দৈনন্দিন জীবনে কতটা গুরুত্বপূর্ণ?",
        "বিবাহকে আপনি কিভাবে দেখেন — সামাজিক চুক্তি নাকি ঈশ্বরের সামনে পবিত্র অঙ্গীকার?",
        "জীবনসঙ্গী নির্বাচনে ডিনমিনেশন (ক্যাথলিক, প্রোটেস্ট্যান্ট ইত্যাদি) কতটা গুরুত্বপূর্ণ?",
        "বিবাহের পর পারিবারিক ও ধর্মীয় দায়িত্ব কিভাবে ভাগ করতে চান?",
        "সন্তান লালন-পালনে খ্রিস্টীয় মূল্যবোধ কিভাবে শেখাতে চান?",
    ],
};
const getDefaultQuestions = (religion) => {
    const key = (religion === null || religion === void 0 ? void 0 : religion.toLowerCase()) || "islam";
    return defaultQuestionsByReligion[key] || defaultQuestionsByReligion["islam"];
};
exports.BioQuestionController = {
    // Get questions for a specific user (public - for buyers to see)
    getQuestionsByUser: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const userId = req.params.userId;
        const questions = yield bio_questions_service_1.BioQuestionService.getQuestionsByUser(userId);
        if (!questions) {
            // Look up the user's religion from GeneralInfo
            const generalInfo = yield general_info_model_1.default.findOne({ user: userId }).lean();
            const religion = (generalInfo === null || generalInfo === void 0 ? void 0 : generalInfo.religion) || "islam";
            return res.status(http_status_1.default.OK).json({
                success: true,
                message: "No custom questions set by this user",
                data: {
                    isCustom: false,
                    questions: getDefaultQuestions(religion),
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
            const religion = (generalInfo === null || generalInfo === void 0 ? void 0 : generalInfo.religion) || "islam";
            return res.status(http_status_1.default.OK).json({
                success: true,
                message: "No custom questions set",
                data: {
                    isCustom: false,
                    questions: getDefaultQuestions(religion),
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
        var _b;
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
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
        var _c;
        const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id;
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
};
