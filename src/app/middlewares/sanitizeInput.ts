import { NextFunction, Request, Response } from "express";

// TODO: drops "$"-prefixed keys at any depth so request data can't smuggle Mongo operators ($set, $inc, $ne...).
const stripOperators = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stripOperators);
  if (!value || typeof value !== "object") return value;
  for (const key of Object.keys(value)) {
    if (key.startsWith("$")) delete (value as any)[key];
    else (value as any)[key] = stripOperators((value as any)[key]);
  }
  return value;
};

export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  stripOperators(req.body);
  stripOperators(req.query);
  stripOperators(req.params);
  next();
};

// TODO: profile sections are always owned by the token's user; a body "user"/"_id" could re-home a record onto someone else.
export const stripOwnerFields = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === "object" && !Array.isArray(req.body)) {
    delete req.body.user;
    delete req.body._id;
  }
  next();
};
