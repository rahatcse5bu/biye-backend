import { Schema, model } from "mongoose";
import { IBioQuestion } from "./bio_questions.interface";

const bioQuestionSchema = new Schema<IBioQuestion>(
  {
    user: {
      type: String,
      required: true,
      unique: true, // One question set per user
      ref: "User",
    },
    questions: {
      type: [String],
      required: true,
      validate: {
        validator: function (v: string[]) {
          return v && v.length > 0 && v.length <= 10; // Between 1 and 10 questions
        },
        message: "Must have between 1 and 10 questions",
      },
    },
  },
  {
    timestamps: true,
  }
);

const BioQuestion = model<IBioQuestion>("BioQuestion", bioQuestionSchema);

export default BioQuestion;
