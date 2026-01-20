"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const bioQuestionSchema = new mongoose_1.Schema({
    user: {
        type: String,
        required: true,
        unique: true,
        ref: "User",
    },
    questions: {
        type: [String],
        required: true,
        validate: {
            validator: function (v) {
                return v && v.length > 0 && v.length <= 10; // Between 1 and 10 questions
            },
            message: "Must have between 1 and 10 questions",
        },
    },
}, {
    timestamps: true,
});
const BioQuestion = (0, mongoose_1.model)("BioQuestion", bioQuestionSchema);
exports.default = BioQuestion;
