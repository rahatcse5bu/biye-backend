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
const LlmRouter = express_1.default.Router();
LlmRouter.post("/chat", (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { messages, model = "meta-llama/llama-4-scout-17b-16e-instruct", temperature = 0.7, max_tokens = 2048 } = req.body;
    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ success: false, message: "Messages array is required" });
    }
    const response = yield (0, groqService_1.callGroqAPI)(messages, model, temperature, max_tokens);
    res.status(200).json(response);
})));
exports.default = LlmRouter;
