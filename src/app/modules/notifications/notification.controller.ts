import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { NotificationService } from "./notification.service";
import { NotificationActor } from "./notification.policy";

const getActor = (req: Request): NotificationActor => {
  if (!req.user?._id || !req.user.user_role) {
    throw new Error("Authenticated user context is missing");
  }
  return {
    _id: req.user._id,
    user_role: String(req.user.user_role),
  };
};

export const NotificationController = {
  ablyToken: catchAsync(async (req: Request, res: Response) => {
    const tokenRequest = await NotificationService.requestToken(getActor(req));
    if (!tokenRequest) {
      return res.status(httpStatus.SERVICE_UNAVAILABLE).json({
        success: false,
        message: "Realtime notifications are not configured",
      });
    }
    res.status(httpStatus.OK).json({
      success: true,
      message: "Realtime notification token created",
      data: tokenRequest,
    });
  }),

  list: catchAsync(async (req: Request, res: Response) => {
    const notifications = await NotificationService.listForActor(
      getActor(req),
      Number(req.query.limit),
    );
    res.status(httpStatus.OK).json({
      success: true,
      message: "Notifications retrieved successfully",
      data: notifications,
    });
  }),

  unreadCount: catchAsync(async (req: Request, res: Response) => {
    const count = await NotificationService.getUnreadCount(getActor(req));
    res.status(httpStatus.OK).json({
      success: true,
      message: "Unread notification count retrieved successfully",
      data: { count },
    });
  }),

  markRead: catchAsync(async (req: Request, res: Response) => {
    const notification = await NotificationService.markRead(
      req.params.id,
      getActor(req),
    );
    if (!notification) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Notification not found",
      });
    }
    res.status(httpStatus.OK).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  }),

  markAllRead: catchAsync(async (req: Request, res: Response) => {
    const result = await NotificationService.markAllRead(getActor(req));
    res.status(httpStatus.OK).json({
      success: true,
      message: "Notifications marked as read",
      data: result,
    });
  }),
};
