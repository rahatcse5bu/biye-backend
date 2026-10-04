import { Request, Response, Router } from "express";
import httpStatus from "http-status";
import { auth } from "../../middlewares/auth";
import catchAsync from "../../../shared/catchAsync";
import { renderEmail } from "../../../shared/bibahoMail";
import { EmailSettingsService } from "./email_settings.service";

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
