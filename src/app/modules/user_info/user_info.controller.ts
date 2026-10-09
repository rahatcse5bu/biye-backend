// userInfo.controller.ts
import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { IUserInfo } from "./user_info.interface";
import { UserInfoService } from "./user_info.services";
import { UserInfoModel } from "./user_info.model";
import ApiError from "../../middlewares/ApiError";
import { adminEmails, userRoleChangeByUser } from "./user_info.constant";
import sendEmail from "../../../shared/SendEmail";
import { escapeHtml, mailAdmins, mailUser } from "../../../shared/bibahoMail";
import generateEmailTemplate from "../../../utils/generateEmailTemplate";

const statusLabels: Record<string, string> = {
  active: "সক্রিয়",
  inactive: "নিষ্ক্রিয়",
  banned: "নিষিদ্ধ",
  pending: "পর্যালোচনাধীন",
  "in review": "রিভিউ চলছে",
};

const statusNotes: Record<string, string> = {
  active: "আপনার বায়োডাটা এখন অন্য সদস্যরা দেখতে ও প্রস্তাব পাঠাতে পারবেন।",
  inactive: "নিষ্ক্রিয় অবস্থায় আপনার বায়োডাটা অন্য কেউ দেখতে পাবেন না। যেকোনো সময় সেটিংস থেকে আবার সক্রিয় করতে পারবেন।",
  banned: "নীতিমালা লঙ্ঘনের কারণে আপনার অ্যাকাউন্ট নিষিদ্ধ করা হয়েছে। ভুল মনে হলে এই ইমেইলের উত্তর দিয়ে আমাদের জানান।",
  "in review": "আমাদের টিম আপনার বায়োডাটা যাচাই করছে। স্ট্যাটাস পরিবর্তন হলে আপনাকে ইমেইল ও নোটিফিকেশনে জানানো হবে।",
};

// TODO: branded user + admin emails for a biodata status change; replaces the old raw-HTML ones that dumped the request body.
const mailStatusChange = (user: any, status: string, byAdmin: boolean) => {
  if (!user?.email || !status) return;
  const label = statusLabels[status] || status;
  const inReview = status === "in review";

  mailUser(user.email, inReview ? "আপনার বায়োডাটা রিভিউয়ের জন্য জমা হয়েছে" : "আপনার বায়োডাটার স্ট্যাটাস পরিবর্তন হয়েছে", {
    title: inReview ? "আপনার বায়োডাটা রিভিউয়ের জন্য জমা হয়েছে" : "আপনার বায়োডাটার স্ট্যাটাস পরিবর্তন হয়েছে",
    tone: status === "active" ? "success" : status === "banned" ? "warning" : "brand",
    paragraphs: [
      inReview
        ? "ধন্যবাদ! আপনার বায়োডাটা আমাদের কাছে পৌঁছেছে।"
        : `${byAdmin ? "Bibaho অ্যাডমিন" : "আপনার অনুরোধে"} আপনার বায়োডাটার স্ট্যাটাস পরিবর্তন করা হয়েছে। আপনার বায়োডাটা এখন <strong>${escapeHtml(label)}</strong>।`,
      ...(statusNotes[status] ? [statusNotes[status]] : []),
    ],
    details: [
      { label: "বায়োডাটা নং", value: user.user_id },
      { label: "স্ট্যাটাস", value: label },
    ],
    action: { label: "ড্যাশবোর্ড দেখুন", path: "/user/account/dashboard" },
  });

  if (byAdmin) return;
  mailAdmins(inReview ? "নতুন বায়োডাটা রিভিউয়ের অপেক্ষায়" : "একজন সদস্য বায়োডাটার স্ট্যাটাস পরিবর্তন করেছেন", {
    title: inReview ? "একটি বায়োডাটা রিভিউয়ের জন্য জমা হয়েছে" : "একজন সদস্য বায়োডাটার স্ট্যাটাস পরিবর্তন করেছেন",
    paragraphs: [
      inReview
        ? "অনুগ্রহ করে বায়োডাটাটি যাচাই করে স্ট্যাটাস আপডেট করুন।"
        : `সদস্য নিজে তার বায়োডাটা <strong>${escapeHtml(label)}</strong> করেছেন।`,
    ],
    details: [
      { label: "বায়োডাটা নং", value: user.user_id },
      { label: "ইমেইল", value: user.email },
      { label: "স্ট্যাটাস", value: label },
    ],
    action: { label: "বায়োডাটা দেখুন", path: `/biodata/${user.user_id}` },
  });
};

export const UserInfoController = {
  getAllUserInfo: catchAsync(async (req: Request, res: Response) => {
    const userInfo = await UserInfoService.getAllUserInfo();
    res.status(httpStatus.OK).json({
      success: true,
      message: "All user info retrieved successfully",
      data: userInfo,
    });
  }),

  sendUserEmail: catchAsync(async (req: Request, res: Response) => {
    const email = req.params.email;
    const { subject, body } = req.body;
    await sendEmail(email, subject, generateEmailTemplate(subject, body));
    res.status(httpStatus.OK).json({
      success: true,
      message: "email is sent",
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
    // TODO: users may only read their own account (same 403 whether or not the email exists); admins can read any.
    const isOwner = Boolean(userInfo) && String(userInfo?._id) === String(req.user?._id);
    if (!isOwner && req.user?.user_role !== "admin") {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: "Forbidden",
      });
    }
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
  googleAuth: catchAsync(async (req: Request, res: Response) => {
    const authData = await UserInfoService.googleAuth(req.body);
    res.status(httpStatus.OK).json({
      success: true,
      message: "Google authentication successful",
      data: authData,
    });
  }),

  register: catchAsync(async (req: Request, res: Response) => {
    const authData = await UserInfoService.register(req.body);
    res.status(httpStatus.CREATED).json({
      success: true,
      message: "User registered successfully",
      data: authData,
    });
  }),

  login: catchAsync(async (req: Request, res: Response) => {
    const authData = await UserInfoService.login(req.body);
    res.status(httpStatus.OK).json({
      success: true,
      message: "Login successful",
      data: authData,
    });
  }),

  forgotPassword: catchAsync(async (req: Request, res: Response) => {
    await UserInfoService.forgotPassword(req.body);
    res.status(httpStatus.OK).json({
      success: true,
      message: "If an account exists for this email, a reset link has been sent",
    });
  }),

  resetPassword: catchAsync(async (req: Request, res: Response) => {
    await UserInfoService.resetPassword(req.body);
    res.status(httpStatus.OK).json({
      success: true,
      message: "Password reset successfully",
    });
  }),

  changePassword: catchAsync(async (req: Request, res: Response) => {
    const id = req.user?._id;
    if (!id) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized");
    }

    // TODO: other sessions are revoked; the caller keeps working with this fresh token.
    const data = await UserInfoService.changePassword(String(id), req.body);
    res.status(httpStatus.OK).json({
      success: true,
      message: "Password changed successfully",
      data,
    });
  }),

  // TODO: only whitelisted preference fields; nothing else on the account can change here.
  updateMyPreferences: catchAsync(async (req: Request, res: Response) => {
    const religion = req.body?.preferred_religion;
    const allowed = ["islam", "hinduism", "christianity", "all"];
    if (!allowed.includes(religion)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: `preferred_religion must be one of: ${allowed.join(", ")}`,
      });
    }
    const updated = await UserInfoModel.findByIdAndUpdate(
      req.user?._id,
      { preferred_religion: religion },
      { new: true },
    )
      .select("preferred_religion")
      .lean();
    if (!updated) {
      return res.status(httpStatus.NOT_FOUND).json({ success: false, message: "User not found" });
    }
    res.status(httpStatus.OK).json({
      success: true,
      message: "Preferences updated successfully",
      data: { preferred_religion: (updated as any).preferred_religion },
    });
  }),

  getMe: catchAsync(async (req: Request, res: Response) => {
    const id = req.user?._id;
    if (!id) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized");
    }

    const userInfo = await UserInfoService.getCurrentUser(String(id));
    res.status(httpStatus.OK).json({
      success: true,
      message: "User info retrieved successfully",
      data: userInfo,
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
    const { points, user_role, ...others } = req.body;

    if (others?.userRole && !userRoleChangeByUser.includes(others)) {
      throw new ApiError(403, "You are not allowed to change user role");
    }

    const userInfo: IUserInfo = others;
    const updatedUserInfo: any = await UserInfoService.updateUserInfo(
      id,
      userInfo
    );
    if (!updatedUserInfo) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "User info not found",
      });
    }

    if (others?.user_status === "in review" || others?.user_status === "inactive") {
      mailStatusChange(updatedUserInfo, others.user_status, false);
    }

    res.status(httpStatus.OK).json({
      success: true,
      message: "User info updated successfully",
      data: updatedUserInfo,
    });
  }),

  updateUserStatusByUser: catchAsync(async (req: Request, res: Response) => {
    const id = req.user?._id;
    if (!id) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const { user_status } = req.body;

    const userInfo: any = { user_status };
    const updatedUserInfo: any = await UserInfoService.updateUserInfo(
      id,
      userInfo
    );
    if (!updatedUserInfo) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "User info not found",
      });
    }

    mailStatusChange(updatedUserInfo, user_status, false);

    res.status(httpStatus.OK).json({
      success: true,
      message: "User status updated successfully",
    });
  }),

  updateUserInfoByAdmin: catchAsync(async (req: Request, res: Response) => {
    const id = req.user?._id;
    const bioId = req.params.bioId;
    if (!id) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
    const userInfo: IUserInfo = req.body;
    const updatedUserInfo = await UserInfoService.updateUserInfo(
      bioId,
      userInfo
    );

    if (!updatedUserInfo) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "User info not found",
      });
    }
    if (userInfo?.user_status) mailStatusChange(updatedUserInfo, userInfo.user_status, true);

    res.status(httpStatus.OK).json({
      success: true,
      message: "User info updated successfully",
      data: updatedUserInfo,
    });
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
