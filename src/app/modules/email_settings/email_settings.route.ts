import { Request, Response, Router } from "express";
import httpStatus from "http-status";
import { auth } from "../../middlewares/auth";
import catchAsync from "../../../shared/catchAsync";
import { renderEmail } from "../../../shared/bibahoMail";
import { EmailSettingsService } from "./email_settings.service";
import { EmailUsageService } from "../email_log/email_log.service";

const router = Router();

router.use(auth("admin"));

router.get(
  "/",
  catchAsync(async (_req: Request, res: Response) => {
    res.status(httpStatus.OK).json({
      success: true,
      message: "Email settings retrieved successfully",
      data: await EmailSettingsService.get(),
    });
  }),
);

router.patch(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    const { data, error } = EmailSettingsService.parse(req.body);
    if (error || !data) {
      res.status(httpStatus.BAD_REQUEST).json({ success: false, message: error });
      return;
    }
    res.status(httpStatus.OK).json({
      success: true,
      message: "Email settings updated successfully",
      data: await EmailSettingsService.update(data),
    });
  }),
);

router.get(
  "/usage",
  catchAsync(async (_req: Request, res: Response) => {
    res.status(httpStatus.OK).json({
      success: true,
      message: "Email usage retrieved successfully",
      data: await EmailUsageService.getUsage(),
    });
  }),
);

router.patch(
  "/daily-limit",
  catchAsync(async (req: Request, res: Response) => {
    const limit = Number(req.body?.daily_limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100000) {
      res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "Daily limit must be a whole number between 1 and 100000" });
      return;
    }
    res.status(httpStatus.OK).json({
      success: true,
      message: "Daily email limit updated",
      data: { daily_limit: await EmailUsageService.setDailyLimit(limit) },
    });
  }),
);

// TODO: renders a sample email from unsaved values so the admin can check before saving.
router.post(
  "/preview",
  catchAsync(async (req: Request, res: Response) => {
    const { data, error } = EmailSettingsService.parse(req.body);
    if (error || !data) {
      res.status(httpStatus.BAD_REQUEST).json({ success: false, message: error });
      return;
    }
    const html = renderEmail(
      {
        title: "পয়েন্ট কেনা সফল হয়েছে",
        tone: "success",
        greeting: "প্রিয় সদস্য,",
        paragraphs: ["এটি একটি নমুনা ইমেইল। আপনার পরিবর্তিত লোগো ও ফুটার লিংক এভাবে দেখাবে।"],
        details: [
          { label: "পরিমাণ", value: "৳100" },
          { label: "যোগ হওয়া পয়েন্ট", value: 120 },
        ],
        action: { label: "ড্যাশবোর্ড দেখুন", path: "/user/account/dashboard" },
      },
      data,
    );
    res.status(httpStatus.OK).json({ success: true, data: { html } });
  }),
);

export default router;
