import axios from "axios";
import config from "../config";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

interface GroqMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

interface GroqRequest {
    model: string;
    messages: GroqMessage[];
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    stream?: boolean;
}

interface GroqResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: GroqMessage;
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

/**
 * Call Groq API for chat completions
 */
export const callGroqAPI = async (
    messages: GroqMessage[],
    model: string = "meta-llama/llama-4-scout-17b-16e-instruct",
    temperature: number = 0.7,
    max_tokens: number = 1024
): Promise<GroqResponse> => {
    const apiKey = config.groq_api_key;

    if (!apiKey) {
        throw new Error("GROQ_API_KEY is not configured");
    }

    const payload: GroqRequest = {
        model,
        messages,
        temperature,
        max_tokens,
    };

    try {
        const response = await axios.post<GroqResponse>(GROQ_API_URL, payload, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
        });

        return response.data;
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            const errorData = error.response?.data || {};
            const errorMessage = errorData.error?.message || JSON.stringify(errorData);
            throw new Error(
                `Groq API Error: ${error.response?.status} - ${errorMessage}`
            );
        }
        throw error;
    }
};

/**
 * Search biodatas using AI
 */
export const searchBiodataWithAI = async (
    searchQuery: string,
    biodataContext?: string
): Promise<string> => {
    const messages: GroqMessage[] = [
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

    const response = await callGroqAPI(messages, "meta-llama/llama-4-scout-17b-16e-instruct", 0.7, 2048);

    if (response.choices && response.choices.length > 0) {
        return response.choices[0].message.content;
    }

    throw new Error("No response from Groq API");
};

/**
 * Parse biodata form using AI
 */
export const parseBiodataForm = async (
    formData: Record<string, any>
): Promise<Record<string, any>> => {
    const messages: GroqMessage[] = [
        {
            role: "system",
            content:
                "You are a JSON parser and biodata field extractor. Extract and validate biodata information from raw form data. Return a valid JSON object with properly categorized fields.",
        },
        {
            role: "user",
            content: `Parse this biodata form data and return clean JSON:\n${JSON.stringify(formData)}`,
        },
    ];

    const response = await callGroqAPI(messages, "meta-llama/llama-4-scout-17b-16e-instruct", 0.3, 2048);

    if (response.choices && response.choices.length > 0) {
        const content = response.choices[0].message.content;
        try {
            return JSON.parse(content);
        } catch {
            return { raw: content };
        }
    }

    throw new Error("Failed to parse biodata");
};

/**
 * Generate biodata summary using AI
 */
export const generateBiodataSummary = async (
    biodataDetails: Record<string, any>
): Promise<string> => {
    const messages: GroqMessage[] = [
        {
            role: "system",
            content:
                "You are a professional biodata profile writer. Create engaging, respectful, and accurate profile summaries for matrimony platforms.",
        },
        {
            role: "user",
            content: `Generate a professional biodata summary from this information:\n${JSON.stringify(biodataDetails)}`,
        },
    ];

    const response = await callGroqAPI(
        messages,
        "llama-3.1-70b-versatile",
    );

    if (response.choices && response.choices.length > 0) {
        return response.choices[0].message.content;
    }

    throw new Error("Failed to generate summary");
};

/**
 * Match compatibility between two biodatas
 */
export const checkBiodataCompatibility = async (
    biodata1: Record<string, any>,
    biodata2: Record<string, any>
): Promise<{
    compatibility_score: number;
    analysis: string;
}> => {
    const messages: GroqMessage[] = [
        {
            role: "system",
            content:
                "You are a matrimony compatibility expert. Analyze two biodata profiles and provide a compatibility score (0-100) with detailed analysis considering factors like age, education, location, religion, values, etc.",
        },
        {
            role: "user",
            content: `Analyze compatibility between these two profiles:\n\nProfile 1:\n${JSON.stringify(biodata1)}\n\nProfile 2:\n${JSON.stringify(biodata2)}\n\nReturn a JSON object with 'compatibility_score' (0-100) and 'analysis' fields.`,
        },
    ];

    const response = await callGroqAPI(messages, "meta-llama/llama-4-scout-17b-16e-instruct", 0.5, 2048);

    if (response.choices && response.choices.length > 0) {
        const content = response.choices[0].message.content;
        try {
            return JSON.parse(content);
        } catch {
            return {
                compatibility_score: 50,
                analysis: content,
            };
        }
    }

    throw new Error("Failed to check compatibility");
};

export default {
    callGroqAPI,
    searchBiodataWithAI,
    parseBiodataForm,
    generateBiodataSummary,
    checkBiodataCompatibility,
};
