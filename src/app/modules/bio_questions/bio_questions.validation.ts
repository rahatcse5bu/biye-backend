import { z } from "zod";

const upsertQuestions = z.object({
  body: z.object({
    questions: z
      .array(
        z.string({
          required_error: "Question text is required",
        })
      )
      .min(1, { message: "At least one question is required" })
      .max(10, { message: "Maximum 10 questions allowed" }),
  }),
});

export const BioQuestionValidation = {
  upsertQuestions,
};
