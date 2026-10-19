import { Request, Response, Router } from "express";
import httpStatus from "http-status";
import { auth } from "../../middlewares/auth";
import catchAsync from "../../../shared/catchAsync";
import { renderEmail } from "../../../shared/bibahoMail";
import { deliverEmail } from "../../../shared/SendEmail";
import { LOCKED_TEMPLATES } from "./email_settings.model";
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
      data: EMAIL_TEMPLATE_CATALOG.map(({ id, code, name, trigger, sample }) => ({
        id,
        code,
        name,
        trigger,
        subject: sample().subject,
        locked: LOCKED_TEMPLATES.includes(id),
      })),
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

// TODO: sends the sample with the unsaved branding through the real SMTP account, so a bad setup shows up before users hit it.
router.post(
  "/test",
  catchAsync(async (req: Request, res: Response) => {
    const to = typeof req.body?.to === "string" ? req.body.to.trim() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "Enter a valid email address to send the test to" });
      return;
    }
    const { data, error } = EmailSettingsService.parse(req.body);
    if (error || !data) {
      res.status(httpStatus.BAD_REQUEST).json({ success: false, message: error });
      return;
    }
    const template = EMAIL_TEMPLATE_CATALOG.find((item) => item.id === req.body?.template) || EMAIL_TEMPLATE_CATALOG[0];
    const { subject, content } = template.sample();
    try {
      await deliverEmail(to, `[Test] ${subject} | Bibaho`, renderEmail(content, data), {
        replyTo: data.support_email,
        fromName: data.sender_name,
      });
    } catch (sendError: any) {
      res.status(httpStatus.BAD_GATEWAY).json({
        success: false,
        message: `Mail server refused the test: ${String(sendError?.response || sendError?.message || sendError).slice(0, 300)}`,
      });
      return;
    }
    res.status(httpStatus.OK).json({ success: true, message: `Test email sent to ${to}` });
  }),
);

export default router;
