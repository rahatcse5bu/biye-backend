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
exports.checkBiodataCompatibility = exports.generateBiodataSummary = exports.parseBiodataForm = exports.searchBiodataWithAI = exports.callGroqAPI = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../config"));
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
/**
 * Call Groq API for chat completions
 */
const callGroqAPI = (messages, model = "meta-llama/llama-4-scout-17b-16e-instruct", temperature = 0.7, max_tokens = 1024) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const apiKey = config_1.default.groq_api_key;
    if (!apiKey) {
        throw new Error("GROQ_API_KEY is not configured");
    }
    const payload = {
        model,
        messages,
        temperature,
        max_tokens,
    };
    try {
        const response = yield axios_1.default.post(GROQ_API_URL, payload, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
        });
        return response.data;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            const errorData = ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || {};
            const errorMessage = ((_b = errorData.error) === null || _b === void 0 ? void 0 : _b.message) || JSON.stringify(errorData);
            throw new Error(`Groq API Error: ${(_c = error.response) === null || _c === void 0 ? void 0 : _c.status} - ${errorMessage}`);
        }
        throw error;
    }
});
exports.callGroqAPI = callGroqAPI;
/**
 * Search biodatas using AI
 */
const searchBiodataWithAI = (searchQuery, biodataContext) => __awaiter(void 0, void 0, void 0, function* () {
    const messages = [
        {
            role: "system",
            content: `You are an intelligent matrimony biodata search assistant. Your task is to understand user search preferences and find matching biodatas based on criteria like age, education, occupation, location, religion, caste, height, etc. 
      
${biodataContext ? `Available biodatas context:\n${biodataContext}` : ""}

Be helpful and provide clear matching results.`,
        },
        {
            role: "user",
            content: searchQuery,
        },
    ];
    const response = yield (0, exports.callGroqAPI)(messages, "meta-llama/llama-4-scout-17b-16e-instruct", 0.7, 2048);
    if (response.choices && response.choices.length > 0) {
        return response.choices[0].message.content;
    }
    throw new Error("No response from Groq API");
});
exports.searchBiodataWithAI = searchBiodataWithAI;
/**
 * Parse biodata form using AI
 */
const parseBiodataForm = (formData) => __awaiter(void 0, void 0, void 0, function* () {
    const messages = [
        {
            role: "system",
            content: "You are a JSON parser and biodata field extractor. Extract and validate biodata information from raw form data. Return a valid JSON object with properly categorized fields.",
        },
        {
            role: "user",
            content: `Parse this biodata form data and return clean JSON:\n${JSON.stringify(formData)}`,
        },
    ];
    const response = yield (0, exports.callGroqAPI)(messages, "meta-llama/llama-4-scout-17b-16e-instruct", 0.3, 2048);
    if (response.choices && response.choices.length > 0) {
        const content = response.choices[0].message.content;
        try {
            return JSON.parse(content);
        }
        catch (_d) {
            return { raw: content };
        }
    }
    throw new Error("Failed to parse biodata");
});
exports.parseBiodataForm = parseBiodataForm;
/**
 * Generate biodata summary using AI
 */
const generateBiodataSummary = (biodataDetails) => __awaiter(void 0, void 0, void 0, function* () {
    const messages = [
        {
            role: "system",
            content: "You are a professional biodata profile writer. Create engaging, respectful, and accurate profile summaries for matrimony platforms.",
        },
        {
            role: "user",
            content: `Generate a professional biodata summary from this information:\n${JSON.stringify(biodataDetails)}`,
        },
    ];
    const response = yield (0, exports.callGroqAPI)(messages, "llama-3.1-70b-versatile");
    if (response.choices && response.choices.length > 0) {
        return response.choices[0].message.content;
    }
    throw new Error("Failed to generate summary");
});
exports.generateBiodataSummary = generateBiodataSummary;
/**
 * Match compatibility between two biodatas
 */
const checkBiodataCompatibility = (biodata1, biodata2) => __awaiter(void 0, void 0, void 0, function* () {
    const messages = [
        {
            role: "system",
            content: "You are a matrimony compatibility expert. Analyze two biodata profiles and provide a compatibility score (0-100) with detailed analysis considering factors like age, education, location, religion, values, etc.",
        },
        {
            role: "user",
            content: `Analyze compatibility between these two profiles:\n\nProfile 1:\n${JSON.stringify(biodata1)}\n\nProfile 2:\n${JSON.stringify(biodata2)}\n\nReturn a JSON object with 'compatibility_score' (0-100) and 'analysis' fields.`,
        },
    ];
    const response = yield (0, exports.callGroqAPI)(messages, "meta-llama/llama-4-scout-17b-16e-instruct", 0.5, 2048);
    if (response.choices && response.choices.length > 0) {
        const content = response.choices[0].message.content;
        try {
            return JSON.parse(content);
        }
        catch (_e) {
            return {
                compatibility_score: 50,
                analysis: content,
            };
        }
    }
    throw new Error("Failed to check compatibility");
});
exports.checkBiodataCompatibility = checkBiodataCompatibility;
exports.default = {
    callGroqAPI: exports.callGroqAPI,
    searchBiodataWithAI: exports.searchBiodataWithAI,
    parseBiodataForm: exports.parseBiodataForm,
    generateBiodataSummary: exports.generateBiodataSummary,
    checkBiodataCompatibility: exports.checkBiodataCompatibility,
};
