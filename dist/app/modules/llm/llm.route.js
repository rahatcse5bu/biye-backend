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
const rateLimit_1 = require("../../../shared/rateLimit");
// TODO: only the model the site uses; callers can't switch to pricier models on our key.
const ALLOWED_MODELS = new Set(["meta-llama/llama-4-scout-17b-16e-instruct"]);
const DEFAULT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const MAX_MESSAGES = 30;
const MAX_CHARS = 20000;
const LlmRouter = express_1.default.Router();
LlmRouter.post("/chat", (0, rateLimit_1.rateLimit)({ name: "llm", windowMs: 10 * 60 * 1000, max: 40, message: "AI search limit reached. Please try again in a few minutes." }), (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { messages, model, temperature, tools, tool_choice } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ success: false, message: "Messages array is required" });
    }
    if (messages.length > MAX_MESSAGES || JSON.stringify(messages).length > MAX_CHARS) {
        return res.status(413).json({ success: false, message: "Conversation is too long" });
    }
    if (tools !== undefined && (!Array.isArray(tools) || tools.length > 10 || JSON.stringify(tools).length > MAX_CHARS)) {
        return res.status(400).json({ success: false, message: "Invalid tools" });
    }
    const response = yield (0, groqService_1.callGroqAPI)(messages, ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL, Math.min(Math.max(Number(temperature) || 0, 0), 1), 1024, { tools, tool_choice: tool_choice === "none" ? "none" : "auto" });
    res.status(200).json(response);
})));
exports.default = LlmRouter;
