import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import UnverifiedContactPurchase from "./unverified_contact_purchase.model";
import httpStatus from "http-status";

const getMyPurchases = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      statusCode: httpStatus.UNAUTHORIZED,
      message: "You are not authorized",
      success: false,
    });
  }

  const purchases = await UnverifiedContactPurchase.find({ user: userId })
    .populate("unverified_biodata", "bio_type gender date_of_birth height blood_group religion zilla bio_id")
    .sort({ createdAt: -1 });

  res.status(httpStatus.OK).json({
    success: true,
    data: purchases,
  });
});

const getPurchaseById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      statusCode: httpStatus.UNAUTHORIZED,
      message: "You are not authorized",
      success: false,
    });
  }

  const purchase = await UnverifiedContactPurchase.findOne({
    _id: id,
    user: userId,
  })
    .populate("unverified_biodata")
    .populate("user", "user_id email");

  if (!purchase) {
    return res.status(httpStatus.NOT_FOUND).json({
      statusCode: httpStatus.NOT_FOUND,
      message: "Purchase not found",
      success: false,
    });
  }

  res.status(httpStatus.OK).json({
    success: true,
    data: purchase,
  });
});

export const UnverifiedContactPurchaseController = {
  getMyPurchases,
  getPurchaseById,
};
