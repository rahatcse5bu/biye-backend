import { NextFunction, Request, Response } from "express";

type Options = { name: string; windowMs: number; max: number; message?: string };

const hitsByKey = new Map<string, number[]>();

// TODO: the client's IP; Vercel and most proxies put it first in x-forwarded-for or in x-real-ip.
const clientIp = (req: Request) =>
  String(req.headers["x-real-ip"] || "").trim() ||
  String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
  req.ip ||
  "unknown";

// TODO: in-memory per-IP limit; on serverless each instance counts separately, which still blocks bursts and scripts.
export const rateLimit = ({ name, windowMs, max, message }: Options) =>
  (req: Request, res: Response, next: NextFunction) => {
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
        if (!times.some((time) => now - time < windowMs)) hitsByKey.delete(entryKey);
      }
    }
    next();
  };
