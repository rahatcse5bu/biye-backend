import { Request, Response } from "express";
import httpStatus from "http-status";
import { AddressService } from "./address.services";
import catchAsync from "../../../shared/catchAsync";
import { UserInfoModel } from "../user_info/user_info.model";
import mongoose from "mongoose";

export const AddressController = {
  getAllAddresses: catchAsync(async (req: Request, res: Response) => {
    const addresses = await AddressService.getAllAddresses();
    res.status(httpStatus.OK).json({
      success: true,
      message: "All addresses retrieved successfully",
      data: addresses,
    });
  }),

  getAddressById: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const address = await AddressService.getAddressById(id);
    if (!address) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Address not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "Address retrieved successfully",
        data: address,
      });
    }
  }),
  getAddressByToken: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const address = await AddressService.getAddressByToken(userId);
    if (!address) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Address not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "Address retrieved successfully",
        data: address,
      });
    }
  }),

  createAddress: catchAsync(async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let { user_form, ...addressData } = req.body;
      addressData.user = req.user?._id;

      // Create address
      const createdAddress = await AddressService.createAddress(addressData, {
        session,
      });

      // Find user and update the fields
      const user: any = await UserInfoModel.findById(req.user?._id).session(
        session
      );

      user.edited_timeline_index = Math.max(
        user.edited_timeline_index,
        user_form
      );
      user.last_edited_timeline_index = user_form;
      await user.save({ session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      res.status(httpStatus.CREATED).json({
        success: true,
        message: "Address created successfully",
        data: createdAddress,
      });
    } catch (error: any) {
      // If any error occurs, abort the transaction
      await session.abortTransaction();
      session.endSession();

      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "An error occurred while creating the address",
        error: error.message,
      });
    }
  }),

  updateAddress: catchAsync(async (req: Request, res: Response) => {
    const id = req.user?._id;
    if (!id) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const updatedFields = req.body;
    const updatedAddress = await AddressService.updateAddress(
      id,
      updatedFields
    );
    if (!updatedAddress) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Address not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "Address updated successfully",
        data: updatedAddress,
      });
    }
  }),

  deleteAddress: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    await AddressService.deleteAddress(id);
    res.status(httpStatus.OK).json({
      success: true,
      message: "Address deleted successfully",
    });
  }),
};
