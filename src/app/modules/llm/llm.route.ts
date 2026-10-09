import express from "express";
import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { callGroqAPI } from "../../../services/groqService";
import { rateLimit } from "../../../shared/rateLimit";

// TODO: only the model the site uses; callers can't switch to pricier models on our key.
const ALLOWED_MODELS = new Set(["meta-llama/llama-4-scout-17b-16e-instruct"]);
const DEFAULT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const MAX_MESSAGES = 30;
const MAX_CHARS = 20000;

const LlmRouter = express.Router();

LlmRouter.post(
  "/chat",
  rateLimit({ name: "llm", windowMs: 10 * 60 * 1000, max: 40, message: "AI search limit reached. Please try again in a few minutes." }),
  catchAsync(async (req: Request, res: Response) => {
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

    const response = await callGroqAPI(
      messages,
      ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL,
      Math.min(Math.max(Number(temperature) || 0, 0), 1),
      1024,
      { tools, tool_choice: tool_choice === "none" ? "none" : "auto" }
    );
    res.status(200).json(response);
  })
);

export default LlmRouter;
