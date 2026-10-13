import { NextFunction, Request, Response } from "express";
import { auth } from "../../middlewares/auth";
import { BIODATA_SECTIONS } from "./biodata_revision.sections";
import { BiodataRevisionService } from "./biodata_revision.service";

const sectionForPath = (path: string) => {
  const match = /^\/api\/v1\/([a-z-]+)(\/token)?\/?$/.exec(path);
  if (!match) return null;
  const section = BIODATA_SECTIONS.find((s) => s.path === match[1]);
  return section ? { section, isTokenRead: Boolean(match[2]) } : null;
};

const requireUser = (req: Request, res: Response) =>
  new Promise<boolean>((resolve) => {
    auth("user", "admin")(req, res, () => resolve(true)).then(() => resolve(res.headersSent ? false : true));
  });

// TODO: for published biodatas, section saves are staged for review and the owner's "/token" reads show the staged values.
export const biodataReviewGate = async (req: Request, res: Response, next: NextFunction) => {
  const match = sectionForPath(req.path);
  if (!match) return next();
  const isWrite = req.method === "POST" || req.method === "PUT";
  const isRead = req.method === "GET" && match.isTokenRead;
  if (!(isWrite && !match.isTokenRead) && !isRead) return next();

  try {
    if (!(await requireUser(req, res))) return;
    const userId = req.user?._id;
    if (!(await BiodataRevisionService.isPublished(userId))) return next();

    if (isWrite) {
      const { live, staged, revision } = await BiodataRevisionService.stage(userId, match.section.key, req.body);
      return res.status(200).json({
        success: true,
        pending_review: true,
        message: revision
          ? "পরিবর্তন সংরক্ষিত হয়েছে। জমা দেওয়ার পর অ্যাডমিন অনুমোদন করলে প্রকাশিত হবে।"
          : "কোনো পরিবর্তন নেই।",
        revision_status: revision?.status || null,
        data: { ...live, ...staged },
      });
    }

    const staged = await BiodataRevisionService.stagedFor(userId, match.section.key);
    if (!staged) return next();
    // TODO: overlay staged fields onto whatever the normal handler returns (including a 404 for a section only staged so far).
    const json = res.json.bind(res);
    res.json = (body: any) => {
      if (body && typeof body === "object") {
        const base = body.data && typeof body.data === "object" && !Array.isArray(body.data) ? body.data : {};
        res.statusCode = 200;
        return json({ ...body, success: true, has_staged_changes: true, data: { ...base, ...staged } });
      }
      return json(body);
    };
    return next();
  } catch (error) {
    return next(error);
  }
};
