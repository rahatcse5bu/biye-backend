import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { RefundError } from "../bkash/bkash.refund";
import { RefundRequestService } from "./refund_request.service";

type Handler = (req: Request, res: Response) => Promise<unknown>;

// TODO: turns RefundError into its status + message; anything else goes to the global handler.
const handle =
  (fn: Handler) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res);
    } catch (error: any) {
      if (error instanceof RefundError) {
        res.status(error.statusCode).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  };

export const RefundRequestController = {
  create: handle(async (req, res) => {
    const request = await RefundRequestService.create(
      String(req.user?._id),
      req.body?.payment_id,
      req.body?.reason,
    );
    res.status(httpStatus.CREATED).json({
      success: true,
      message: "Refund request submitted",
      data: request,
    });
  }),

  listMine: handle(async (req, res) => {
    const requests = await RefundRequestService.listForUser(String(req.user?._id));
    res.status(httpStatus.OK).json({
      success: true,
      message: "Refund requests retrieved successfully",
      data: requests,
    });
  }),

  listAll: handle(async (req, res) => {
    const requests = await RefundRequestService.listAll(
      typeof req.query.status === "string" ? req.query.status : undefined,
    );
    res.status(httpStatus.OK).json({
      success: true,
      message: "Refund requests retrieved successfully",
      data: requests,
    });
  }),

  approve: handle(async (req, res) => {
    const result = await RefundRequestService.approve(req.params.id);
    res.status(httpStatus.OK).json({
      success: true,
      message: "Refund completed",
      data: result,
    });
  }),

  reject: handle(async (req, res) => {
    const request = await RefundRequestService.reject(req.params.id, req.body?.note);
    res.status(httpStatus.OK).json({
      success: true,
      message: "Refund request rejected and points returned",
      data: request,
    });
  }),
};
