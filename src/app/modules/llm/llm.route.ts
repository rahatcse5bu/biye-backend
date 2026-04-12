import express from "express";
import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { callGroqAPI } from "../../../services/groqService";

const LlmRouter = express.Router();

LlmRouter.post(
  "/chat",
  catchAsync(async (req: Request, res: Response) => {
    const { messages, model = "meta-llama/llama-4-scout-17b-16e-instruct", temperature = 0.7, max_tokens = 2048 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: "Messages array is required" });
    }

    const response = await callGroqAPI(messages, model, temperature, max_tokens);
    res.status(200).json(response);
  })
);

export default LlmRouter;
