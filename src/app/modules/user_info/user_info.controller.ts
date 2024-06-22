// userInfo.controller.ts
import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { IUserInfo } from "./user_info.interface";
import { UserInfoService } from "./user_info.services";

export const UserInfoController = {
  getAllUserInfo: catchAsync(async (req: Request, res: Response) => {
    const userInfo = await UserInfoService.getAllUserInfo();
    res.status(httpStatus.OK).json({
      success: true,
      message: "All user info retrieved successfully",
      data: userInfo,
    });
  }),

  getUserInfoById: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const userInfo = await UserInfoService.getUserInfoById(id);
    if (!userInfo) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "User info not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "User info retrieved successfully",
        data: userInfo,
      });
    }
  }),

  getUserStatus: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const userStatus = await UserInfoService.getUserStatus(id);
    if (!userStatus) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "User info not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "User info retrieved successfully",
        data: userStatus,
      });
    }
  }),
  getUserInfoByEmail: catchAsync(async (req: Request, res: Response) => {
    const email = req.params.email;
    const userInfo = await UserInfoService.getUserInfoByEmail(email);
    if (!userInfo) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
    } else {
      res.status(200).json({
        message: "User retrieved successfully",
        success: true,
        data: userInfo,
      });
    }
  }),

  createUserInfo: catchAsync(async (req: Request, res: Response) => {
    const userInfo: IUserInfo = req.body;
    const createdUserInfo = await UserInfoService.createUserInfo(userInfo);
    res.status(httpStatus.CREATED).json({
      success: true,
      message: "User info created successfully",
      data: createdUserInfo,
    });
  }),
  createUserForGoogleSignIn: catchAsync(async (req: Request, res: Response) => {
    const userInfo: IUserInfo = req.body;
    const createdUserInfo = await UserInfoService.createUserForGoogleSignIn(
      userInfo
    );
    res.status(httpStatus.CREATED).json({
      success: true,
      message: "User info created successfully",
      data: createdUserInfo,
    });
  }),

  updateUserInfo: catchAsync(async (req: Request, res: Response) => {
    const id = req.user?._id;
    if (!id) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const userInfo: IUserInfo = req.body;
    const updatedUserInfo = await UserInfoService.updateUserInfo(id, userInfo);
    if (!updatedUserInfo) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "User info not found",
      });
    } else {
      res.status(httpStatus.OK).json({
        success: true,
        message: "User info updated successfully",
        data: updatedUserInfo,
      });
    }
  }),

  verifyTokenByUser: catchAsync(async (req: Request, res: Response) => {
    const id = req.user?._id;
    if (!id) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }

    res.json({
      success: true,
      data: req.user,
    });
  }),
  getAllUsersInfoId: catchAsync(async (req: Request, res: Response) => {
    const userInfo = await UserInfoService.getAllUsersInfoId();
    res.status(httpStatus.OK).json({
      success: true,
      message: "All user info retrieved successfully",
      data: userInfo,
    });
  }),
  deleteUserInfo: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    await UserInfoService.deleteUserInfo(id);
    res.status(httpStatus.OK).json({
      success: true,
      message: "User info deleted successfully",
    });
  }),
};
