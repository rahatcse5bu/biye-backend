"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimit = void 0;
const hitsByKey = new Map();
// TODO: the client's IP; Vercel and most proxies put it first in x-forwarded-for or in x-real-ip.
const clientIp = (req) => String(req.headers["x-real-ip"] || "").trim() ||
    String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.ip ||
    "unknown";
// TODO: in-memory per-IP limit; on serverless each instance counts separately, which still blocks bursts and scripts.
const rateLimit = ({ name, windowMs, max, message }) => (req, res, next) => {
    const now = Date.now();
    const key = `${name}:${clientIp(req)}`;
    const recent = (hitsByKey.get(key) || []).filter((time) => now - time < windowMs);
    if (recent.length >= max) {
        res.setHeader("Retry-After", Math.ceil((windowMs - (now - recent[0])) / 1000));
        return res.status(429).json({
            success: false,
            message: message || "Too many requests. Please try again later.",
        });
    }
    recent.push(now);
    hitsByKey.set(key, recent);
    // TODO: drop idle entries now and then so memory stays bounded.
    if (hitsByKey.size > 5000) {
        for (const [entryKey, times] of hitsByKey) {
            if (!times.some((time) => now - time < windowMs))
                hitsByKey.delete(entryKey);
        }
    }
    next();
};
exports.rateLimit = rateLimit;
