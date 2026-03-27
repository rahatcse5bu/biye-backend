import express from "express";
import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import config from "../../../config";
import axios from "axios";

const LlmRouter = express.Router();

LlmRouter.post(
  "/chat",
  catchAsync(async (req: Request, res: Response) => {
    const apiKey = config.openrouter_api_key;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: "LLM not configured" });
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      req.body,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://pncnikah.com",
        },
      }
    );

    res.status(200).json(response.data);
  })
);

export default LlmRouter;
