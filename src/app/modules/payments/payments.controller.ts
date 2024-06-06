import { Request, Response } from "express";
import httpStatus from "http-status";
import { PaymentService } from "./payments.service";
import catchAsync from "../../../shared/catchAsync";
import { UserInfoModel } from "../user_info/user_info.model";
import mongoose from "mongoose";

export const PaymentController = {
  getAllPayments: catchAsync(async (req: Request, res: Response) => {
    const payments = await PaymentService.getAllPayments();
    res.status(httpStatus.OK).json({
      success: true,
      message: "All payments retrieved successfully",
      data: payments,
    });
  }),

  getPaymentById: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const payment = await PaymentService.getPaymentById(id);
    if (!payment) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Payment not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "Payment retrieved successfully",
        data: payment,
      });
    }
  }),
  getPaymentByToken: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const payment = await PaymentService.getPaymentByToken(userId);
    if (!payment) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Payment not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "Payment retrieved successfully",
        data: payment,
      });
    }
  }),

  createPayment: catchAsync(async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let { user_form, ...paymentData } = req.body;
      paymentData.user = req.user?._id;

      // Create payment
      const createdPayment = await PaymentService.createPayment(paymentData, {
        session,
      });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      res.status(httpStatus.CREATED).json({
        success: true,
        message: "Payment created successfully",
        data: createdPayment,
      });
    } catch (error: any) {
      // If any error occurs, abort the transaction
      await session.abortTransaction();
      session.endSession();

      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "An error occurred while creating the payment",
        error: error.message,
      });
    }
  }),

  updatePayment: catchAsync(async (req: Request, res: Response) => {
    const id = req.user?._id;
    if (!id) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const updatedFields = req.body;
    const updatedPayment = await PaymentService.updatePayment(
      id,
      updatedFields
    );
    if (!updatedPayment) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Payment not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "Payment updated successfully",
        data: updatedPayment,
      });
    }
  }),

  deletePayment: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    await PaymentService.deletePayment(id);
    res.status(httpStatus.OK).json({
      success: true,
      message: "Payment deleted successfully",
    });
  }),
};
