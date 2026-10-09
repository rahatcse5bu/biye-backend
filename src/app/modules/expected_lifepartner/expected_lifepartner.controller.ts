import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { UserInfoModel } from "../user_info/user_info.model";
import mongoose from "mongoose";
import { ExpectedPartnerService } from "./expected_lifepartner.services";

// TODO: fields a client must never set: ownership, ids and form bookkeeping.
const stripProtected = (body: any) => {
  const { user, _id, __v, user_form, ...fields } = body || {};
  return fields;
};

// TODO: bad input (wrong types, invalid values) is the client's mistake, not a server error.
const isInputError = (error: any) => error?.name === "ValidationError" || error?.name === "CastError";

export const ExpectedPartnerController = {
  getAllExpectedPartners: catchAsync(async (req: Request, res: Response) => {
    const expectedPartners =
      await ExpectedPartnerService.getAllExpectedPartners();
    res.status(httpStatus.OK).json({
      success: true,
      message: "All expectedPartners retrieved successfully",
      data: expectedPartners,
    });
  }),

  getExpectedPartnerById: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const expectedPartner = await ExpectedPartnerService.getExpectedPartnerById(
      id
    );
    if (!expectedPartner) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "ExpectedPartner not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "ExpectedPartner retrieved successfully",
        data: expectedPartner,
      });
    }
  }),
  getExpectedPartnerByToken: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const expectedPartner =
      await ExpectedPartnerService.getExpectedPartnerByToken(userId);
    if (!expectedPartner) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "ExpectedPartner not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "ExpectedPartner retrieved successfully",
        data: expectedPartner,
      });
    }
  }),

  createExpectedPartner: catchAsync(async (req: Request, res: Response) => {
    const user_form = req.body?.user_form;
    const fields = stripProtected(req.body);

    // TODO: one attempt = upsert the record + update the form timeline, all-or-nothing.
    const attempt = async () => {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const result = await ExpectedPartnerService.upsertExpectedPartner(
          String(req.user?._id),
          fields,
          { session }
        );
        const user: any = await UserInfoModel.findById(req.user?._id).session(session);
        user.edited_timeline_index = Math.max(user.edited_timeline_index, user_form);
        user.last_edited_timeline_index = user_form;
        await user.save({ session });
        await session.commitTransaction();
        return result;
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    };

    try {
      let result;
      // TODO: MongoDB asks to retry transactions that hit a transient conflict (e.g. two saves at once).
      for (let tries = 1; ; tries++) {
        try {
          result = await attempt();
          break;
        } catch (error: any) {
          const transient = error?.errorLabels?.includes?.("TransientTransactionError") || error?.hasErrorLabel?.("TransientTransactionError");
          if (!transient || tries >= 5) throw error;
          // TODO: random backoff so simultaneous saves stop colliding on the retry.
          await new Promise((resolve) => setTimeout(resolve, 40 * tries + Math.random() * 80));
        }
      }

      res.status(result.created ? httpStatus.CREATED : httpStatus.OK).json({
        success: true,
        message: result.created ? "ExpectedPartner created successfully" : "ExpectedPartner updated successfully",
        data: result.record,
      });
    } catch (error: any) {
      if (isInputError(error)) {
        return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: `Invalid data: ${error.message}` });
      }
      console.error("Expected partner create failed:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "An error occurred while creating the expectedPartner",
      });
    }
  }),

  updateExpectedPartner: catchAsync(async (req: Request, res: Response) => {
    const id = req.user?._id;
    if (!id) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    let updatedExpectedPartner;
    try {
      updatedExpectedPartner = await ExpectedPartnerService.updateExpectedPartner(
        id,
        stripProtected(req.body)
      );
    } catch (error: any) {
      if (!isInputError(error)) throw error;
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: `Invalid data: ${error.message}` });
    }
    if (!updatedExpectedPartner) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "ExpectedPartner not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "ExpectedPartner updated successfully",
        data: updatedExpectedPartner,
      });
    }
  }),

  deleteExpectedPartner: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    await ExpectedPartnerService.deleteExpectedPartner(id);
    res.status(httpStatus.OK).json({
      success: true,
      message: "ExpectedPartner deleted successfully",
    });
  }),
};
