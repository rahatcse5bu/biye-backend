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
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimit = void 0;
const crypto_1 = require("crypto");
const rateLimit_model_1 = require("./rateLimit.model");
const rateLimit = ({ name, windowMs, max, message }) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const now = Date.now();
    const expiresAt = (Math.floor(now / windowMs) + 1) * windowMs;
    const ip = (0, crypto_1.createHash)("sha256").update(req.ip || "unknown").digest("hex");
    const key = `${name}:${ip}:${expiresAt}`;
    try {
        const increment = () => rateLimit_model_1.RateLimitBucket.findOneAndUpdate({ _id: key }, { $inc: { hits: 1 }, $setOnInsert: { expires_at: new Date(expiresAt) } }, { upsert: true, new: true }).lean();
        const bucket = yield increment().catch((error) => {
            if ((error === null || error === void 0 ? void 0 : error.code) !== 11000)
                throw error;
            return increment();
        });
        if (!bucket || bucket.hits > max) {
            res.setHeader("Retry-After", Math.max(1, Math.ceil((expiresAt - now) / 1000)));
            return res.status(429).json({
                success: false,
                message: message || "Too many requests. Please try again later.",
            });
        }
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.rateLimit = rateLimit;
