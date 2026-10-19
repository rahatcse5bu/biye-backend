import { Request, Response, Router } from "express";
import httpStatus from "http-status";
import { auth } from "../../middlewares/auth";
import authCheck from "../../middlewares/authCheck";
import catchAsync from "../../../shared/catchAsync";
import { FeaturedRequestService } from "./featured_request.service";

const router = Router();

// TODO: public, so the site can show the price before login.
router.get(
  "/settings",
  catchAsync(async (_req: Request, res: Response) => {
    res.status(httpStatus.OK).json({ success: true, data: await FeaturedRequestService.getSettings() });
  }),
);

router.patch(
  "/settings",
  auth("admin"),
  catchAsync(async (req: Request, res: Response) => {
    const { data, error } = FeaturedRequestService.parseSettings(req.body);
    if (error || !data) {
      res.status(httpStatus.BAD_REQUEST).json({ success: false, message: error });
      return;
    }
    res.status(httpStatus.OK).json({
      success: true,
      message: "Featured settings updated",
      data: await FeaturedRequestService.updateSettings(data),
    });
  }),
);

router.get(
  "/me",
  auth("user", "admin"),
  catchAsync(async (req: Request, res: Response) => {
    res.status(httpStatus.OK).json({ success: true, data: await FeaturedRequestService.getMine(String(req.user?._id)) });
  }),
);

// TODO: authCheck loads the bKash base URL and token; without it a cold serverless instance calls "undefined/checkout/create".
router.post(
  "/checkout",
  auth("user", "admin"),
  authCheck,
  catchAsync(async (req: Request, res: Response) => {
    res.status(httpStatus.OK).json({
      success: true,
      data: await FeaturedRequestService.startCheckout(String(req.user?._id), req.body?.callbackURL),
    });
  }),
);

// TODO: public so anonymous visitors count too; the service caps ids and only credits running paid periods.
router.post(
  "/track",
  catchAsync(async (req: Request, res: Response) => {
    await FeaturedRequestService.track(req.body?.biodata_ids, req.body?.event);
    res.status(httpStatus.NO_CONTENT).end();
  }),
);

router.get(
  "/",
  auth("admin"),
  catchAsync(async (req: Request, res: Response) => {
    const result = await FeaturedRequestService.listAll(req.query.status, req.query.page, req.query.limit);
    res.status(httpStatus.OK).json({ success: true, ...result });
  }),
);

router.post(
  "/:id/approve",
  auth("admin"),
  catchAsync(async (req: Request, res: Response) => {
    res.status(httpStatus.OK).json({
      success: true,
      message: "Biodata featured",
      data: await FeaturedRequestService.approve(req.params.id, req.body?.note),
    });
  }),
);

router.post(
  "/:id/reject",
  auth("admin"),
  catchAsync(async (req: Request, res: Response) => {
    res.status(httpStatus.OK).json({
      success: true,
      message: "Request rejected",
      data: await FeaturedRequestService.reject(req.params.id, req.body?.note, req.body?.refund),
    });
  }),
);

export default router;
