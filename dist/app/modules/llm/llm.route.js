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
const config_1 = __importDefault(require("../../../config"));
const axios_1 = __importDefault(require("axios"));
const LlmRouter = express_1.default.Router();
LlmRouter.post("/chat", (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const apiKey = config_1.default.openrouter_api_key;
    if (!apiKey) {
        return res.status(500).json({ success: false, message: "LLM not configured" });
    }
    const response = yield axios_1.default.post("https://openrouter.ai/api/v1/chat/completions", req.body, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://pncnikah.com",
        },
    });
    res.status(200).json(response.data);
})));
exports.default = LlmRouter;
