import { NextFunction, Request, Response } from "express";
import { createHash } from "crypto";
import { RateLimitBucket } from "./rateLimit.model";

type Options = { name: string; windowMs: number; max: number; message?: string };

export const rateLimit = ({ name, windowMs, max, message }: Options) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const expiresAt = (Math.floor(now / windowMs) + 1) * windowMs;
    const ip = createHash("sha256").update(req.ip || "unknown").digest("hex");
    const key = `${name}:${ip}:${expiresAt}`;
    try {
      const increment = () => RateLimitBucket.findOneAndUpdate(
        { _id: key },
        { $inc: { hits: 1 }, $setOnInsert: { expires_at: new Date(expiresAt) } },
        { upsert: true, new: true },
      ).lean();
      const bucket = await increment().catch((error) => {
        if (error?.code !== 11000) throw error;
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
    } catch (error) {
      next(error);
    }
  };
