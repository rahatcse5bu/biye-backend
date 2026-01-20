"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BioQuestionValidation = void 0;
const zod_1 = require("zod");
const upsertQuestions = zod_1.z.object({
    body: zod_1.z.object({
        questions: zod_1.z
            .array(zod_1.z.string({
            required_error: "Question text is required",
        }))
            .min(1, { message: "At least one question is required" })
            .max(10, { message: "Maximum 10 questions allowed" }),
    }),
});
exports.BioQuestionValidation = {
    upsertQuestions,
};
