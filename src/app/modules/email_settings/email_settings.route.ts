import { Request, Response, Router } from "express";
import httpStatus from "http-status";
import { auth } from "../../middlewares/auth";
import catchAsync from "../../../shared/catchAsync";
import { renderEmail } from "../../../shared/bibahoMail";
import { EMAIL_TEMPLATE_CATALOG } from "../../../shared/emailTemplates";
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

router.get(
  "/templates",
  catchAsync(async (_req: Request, res: Response) => {
    res.status(httpStatus.OK).json({
      success: true,
      message: "Email templates retrieved successfully",
      data: EMAIL_TEMPLATE_CATALOG.map(({ id, code, name, trigger, sample }) => ({ id, code, name, trigger, subject: sample().subject })),
    });
  }),
);

// TODO: renders a template with sample data and the unsaved branding so the admin can check before saving.
router.post(
  "/preview",
  catchAsync(async (req: Request, res: Response) => {
    const { data, error } = EmailSettingsService.parse(req.body);
    if (error || !data) {
      res.status(httpStatus.BAD_REQUEST).json({ success: false, message: error });
      return;
    }
    const template = EMAIL_TEMPLATE_CATALOG.find((item) => item.id === req.body?.template) || EMAIL_TEMPLATE_CATALOG[0];
    const { subject, content } = template.sample();
    res.status(httpStatus.OK).json({ success: true, data: { html: renderEmail(content, data), subject, template: template.id } });
  }),
);

export default router;
