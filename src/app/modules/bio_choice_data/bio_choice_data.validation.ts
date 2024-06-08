import { z } from "zod";
import { bioChoiceStatus } from "./bio_choice_data.constant";

const createBioChoice = z.object({
  body: z.object({
    bio_user: z.string({
      required_error: "bio_user is required ",
    }),
    bio_details: z.string({
      required_error: "bio_details is required ",
    }),
    feedback: z
      .string({
        required_error: "feedback is required ",
      })
      .optional(),
    status: z.enum([...bioChoiceStatus] as [string, ...string[]]),
  }),
});
const updateBioChoice = z.object({
  body: z.object({
    user: z.string({
      required_error: "user is required ",
    }),
    bio_details: z
      .string({
        required_error: "bio_details is required ",
      })
      .optional(),
    feedback: z
      .string({
        required_error: "feedback is required ",
      })
      .optional(),
  }),
});

export const BioChoiceValidation = {
  createBioChoice,
  updateBioChoice,
};
