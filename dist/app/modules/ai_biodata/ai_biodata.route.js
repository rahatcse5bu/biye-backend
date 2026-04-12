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
const express_1 = __importDefault(require("express"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const groqService_1 = require("../../../services/groqService");
const AiBiodataRouter = express_1.default.Router();
/**
 * POST /ai-biodata/search
 * AI-powered biodata search
 */
AiBiodataRouter.post("/search", (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query, context } = req.body;
    if (!query) {
        return res
            .status(400)
            .json({ success: false, message: "Search query is required" });
    }
    const result = yield (0, groqService_1.searchBiodataWithAI)(query, context);
    res.status(200).json({
        success: true,
        message: "AI search completed",
        data: result,
    });
})));
/**
 * POST /ai-biodata/parse
 * Parse and validate biodata form data
 */
AiBiodataRouter.post("/parse", (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { formData } = req.body;
    if (!formData) {
        return res
            .status(400)
            .json({ success: false, message: "Form data is required" });
    }
    const result = yield (0, groqService_1.parseBiodataForm)(formData);
    res.status(200).json({
        success: true,
        message: "Biodata parsed successfully",
        data: result,
    });
})));
/**
 * POST /ai-biodata/summary
 * Generate AI biodata summary
 */
AiBiodataRouter.post("/summary", (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { biodataDetails } = req.body;
    if (!biodataDetails) {
        return res
            .status(400)
            .json({ success: false, message: "Biodata details are required" });
    }
    const summary = yield (0, groqService_1.generateBiodataSummary)(biodataDetails);
    res.status(200).json({
        success: true,
        message: "Summary generated successfully",
        data: summary,
    });
})));
/**
 * POST /ai-biodata/compatibility
 * Check compatibility between two biodatas
 */
AiBiodataRouter.post("/compatibility", (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { biodata1, biodata2 } = req.body;
    if (!biodata1 || !biodata2) {
        return res.status(400).json({
            success: false,
            message: "Both biodata profiles are required",
        });
    }
    const result = yield (0, groqService_1.checkBiodataCompatibility)(biodata1, biodata2);
    res.status(200).json({
        success: true,
        message: "Compatibility check completed",
        data: result,
    });
})));
/**
 * POST /ai-biodata/chat
 * Direct Groq API chat endpoint
 */
AiBiodataRouter.post("/chat", (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { messages, model, temperature, max_tokens } = req.body;
    if (!messages || !Array.isArray(messages)) {
        return res
            .status(400)
            .json({ success: false, message: "Messages array is required" });
    }
    const result = yield (0, groqService_1.callGroqAPI)(messages, model || "meta-llama/llama-4-scout-17b-16e-instruct", temperature || 0.7, max_tokens || 2048);
    res.status(200).json({
        success: true,
        message: "Chat response received",
        data: result,
    });
})));
exports.default = AiBiodataRouter;
