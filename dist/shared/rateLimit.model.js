"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitBucket = void 0;
const mongoose_1 = require("mongoose");
const rateLimitSchema = new mongoose_1.Schema({
    _id: { type: String, required: true },
    hits: { type: Number, required: true },
    expires_at: { type: Date, required: true, index: { expires: 0 } },
});
exports.RateLimitBucket = (0, mongoose_1.model)("RateLimitBucket", rateLimitSchema);
