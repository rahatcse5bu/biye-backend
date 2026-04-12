import express, { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import {
    searchBiodataWithAI,
    parseBiodataForm,
    generateBiodataSummary,
    checkBiodataCompatibility,
    callGroqAPI,
} from "../../../services/groqService";

const AiBiodataRouter = express.Router();

/**
 * POST /ai-biodata/search
 * AI-powered biodata search
 */
AiBiodataRouter.post(
    "/search",
    catchAsync(async (req: Request, res: Response) => {
        const { query, context } = req.body;

        if (!query) {
            return res
                .status(400)
                .json({ success: false, message: "Search query is required" });
        }

        const result = await searchBiodataWithAI(query, context);

        res.status(200).json({
            success: true,
            message: "AI search completed",
            data: result,
        });
    })
);

/**
 * POST /ai-biodata/parse
 * Parse and validate biodata form data
 */
AiBiodataRouter.post(
    "/parse",
    catchAsync(async (req: Request, res: Response) => {
        const { formData } = req.body;

        if (!formData) {
            return res
                .status(400)
                .json({ success: false, message: "Form data is required" });
        }

        const result = await parseBiodataForm(formData);

        res.status(200).json({
            success: true,
            message: "Biodata parsed successfully",
            data: result,
        });
    })
);

/**
 * POST /ai-biodata/summary
 * Generate AI biodata summary
 */
AiBiodataRouter.post(
    "/summary",
    catchAsync(async (req: Request, res: Response) => {
        const { biodataDetails } = req.body;

        if (!biodataDetails) {
            return res
                .status(400)
                .json({ success: false, message: "Biodata details are required" });
        }

        const summary = await generateBiodataSummary(biodataDetails);

        res.status(200).json({
            success: true,
            message: "Summary generated successfully",
            data: summary,
        });
    })
);

/**
 * POST /ai-biodata/compatibility
 * Check compatibility between two biodatas
 */
AiBiodataRouter.post(
    "/compatibility",
    catchAsync(async (req: Request, res: Response) => {
        const { biodata1, biodata2 } = req.body;

        if (!biodata1 || !biodata2) {
            return res.status(400).json({
                success: false,
                message: "Both biodata profiles are required",
            });
        }

        const result = await checkBiodataCompatibility(biodata1, biodata2);

        res.status(200).json({
            success: true,
            message: "Compatibility check completed",
            data: result,
        });
    })
);

/**
 * POST /ai-biodata/chat
 * Direct Groq API chat endpoint
 */
AiBiodataRouter.post(
    "/chat",
    catchAsync(async (req: Request, res: Response) => {
        const { messages, model, temperature, max_tokens } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res
                .status(400)
                .json({ success: false, message: "Messages array is required" });
        }

        const result = await callGroqAPI(
            messages,
            model || "meta-llama/llama-4-scout-17b-16e-instruct",
            temperature || 0.7,
            max_tokens || 2048
        );

        res.status(200).json({
            success: true,
            message: "Chat response received",
            data: result,
        });
    })
);

export default AiBiodataRouter;
