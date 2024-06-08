"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BioChoiceValidation = void 0;
const zod_1 = require("zod");
const bio_choice_data_constant_1 = require("./bio_choice_data.constant");
const createBioChoice = zod_1.z.object({
    body: zod_1.z.object({
        bio_user: zod_1.z.string({
            required_error: "bio_user is required ",
        }),
        bio_details: zod_1.z.string({
            required_error: "bio_details is required ",
        }),
        feedback: zod_1.z
            .string({
            required_error: "feedback is required ",
        })
            .optional(),
        status: zod_1.z.enum([...bio_choice_data_constant_1.bioChoiceStatus]),
    }),
});
const updateBioChoice = zod_1.z.object({
    body: zod_1.z.object({
        user: zod_1.z.string({
            required_error: "user is required ",
        }),
        bio_details: zod_1.z
            .string({
            required_error: "bio_details is required ",
        })
            .optional(),
        feedback: zod_1.z
            .string({
            required_error: "feedback is required ",
        })
            .optional(),
    }),
});
exports.BioChoiceValidation = {
    createBioChoice,
    updateBioChoice,
};
