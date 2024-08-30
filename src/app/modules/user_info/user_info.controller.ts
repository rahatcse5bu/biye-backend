// userInfo.controller.ts
import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { IUserInfo } from "./user_info.interface";
import { UserInfoService } from "./user_info.services";
import ApiError from "../../middlewares/ApiError";
import { adminEmails, userRoleChangeByUser } from "./user_info.constant";
import sendEmail, { sendEmails } from "../../../shared/SendEmail";
import generateEmailTemplate from "../../../utils/generateEmailTemplate";

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

    if (req?.user && req?.user.email !== userInfo?.email) {
      throw new ApiError(401, "You are not allowed to access this");
    }
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
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "User info not found",
      });
    }

    if (others?.user_status === "in review") {
      // notify to admin
      const adminHtml = `
      <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bio Data Inactivation Notification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border: 1px solid #dddddd;
      border-radius: 5px;
      box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #ff4500;
      color: #ffffff;
      padding: 10px 20px;
      border-top-left-radius: 5px;
      border-top-right-radius: 5px;
      text-align: center;
      font-size: 24px;
    }
    .content {
      padding: 20px;
      color: #555555;
      line-height: 1.6;
    }
    .content strong {
      color: #333333;
    }
    .footer {
      padding: 10px 20px;
      background-color: #f4f4f4;
      border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px;
      text-align: center;
      font-size: 12px;
      color: #aaaaaa;
    }
    .button {
      display: block;
      width: 200px;
      margin: 20px auto;
      padding: 10px;
      background-color: #ff4500;
      color: #ffffff;
      text-align: center;
      border-radius: 5px;
      text-decoration: none;
    }
  </style>
</head>
<body>
      <table class="main-table">
        <tr>
          <td class="header">
            Admin Notification
          </td>
        </tr>
        <tr>
          <td class="content">
            <p>Dear Admin,</p>
            <p>The user <strong>${
              updatedUserInfo?.email
            }</strong> has submitted their bio data for review.</p>
            <p><strong>Current Status:</strong> ${others?.user_status}</p>
            <p><strong>Submitted Data:</strong></p>
            <ul>
              ${
                req.body &&
                Object.keys(req.body).length &&
                Object.keys(req.body)
                  .map((field: any) => `<li>${field}: ${req.body[field]}</li>`)
                  .join("")
              }
            </ul>
            <p>Please review the data and update the user status accordingly.</p>
            <a href="https://admin.pnc-nikah.com/details/${
              updatedUserInfo?.user_id
            }" class="button">Review Now</a>
          </td>
        </tr>
        <tr>
          <td class="footer">
            &copy; 2024 PNC Nikah. All rights reserved.
          </td>
        </tr>
      </table>
      </body>
      </html>
    `;

      const userHtml = `
      <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bio Data Inactivation Notification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border: 1px solid #dddddd;
      border-radius: 5px;
      box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #ff4500;
      color: #ffffff;
      padding: 10px 20px;
      border-top-left-radius: 5px;
      border-top-right-radius: 5px;
      text-align: center;
      font-size: 24px;
    }
    .content {
      padding: 20px;
      color: #555555;
      line-height: 1.6;
    }
    .content strong {
      color: #333333;
    }
    .footer {
      padding: 10px 20px;
      background-color: #f4f4f4;
      border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px;
      text-align: center;
      font-size: 12px;
      color: #aaaaaa;
    }
    .button {
      display: block;
      width: 200px;
      margin: 20px auto;
      padding: 10px;
      background-color: #ff4500;
      color: #ffffff;
      text-align: center;
      border-radius: 5px;
      text-decoration: none;
    }
  </style>
</head>
<body>
      <table class="main-table">
        <tr>
          <td class="header">
            
          </td>
        </tr>
        <tr>
          <td class="content">
            <p>Dear <strong>Sir/Mam</strong>,</p>
            <p>Your bio data has been submitted for review. You will be notified when your status changes.</p>
            <p><strong>Current Status:</strong> ${others?.user_status}</p>
            <p><strong>Submitted Data:</strong></p>
            <ul>
              ${
                req.body &&
                Object.keys(req.body).length &&
                Object.keys(req.body)
                  .map((field: any) => `<li>${field}: ${req.body[field]}</li>`)
                  .join("")
              }
            </ul>
            <p>Thank you for your patience.</p>
          </td>
        </tr>
        <tr>
          <td class="footer">
            &copy; 2024 PNC Nikah. All rights reserved.
          </td>
        </tr>
      </table> </body></html>
      
      `;
      await sendEmails(adminEmails, " Admin Notification", adminHtml);
      await sendEmail(
        updatedUserInfo?.email,
        "Status Change Notification",
        userHtml
      );
    } else if (others?.user_status === "inactive") {
      const adminHtml = `
      <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bio Data Inactivation Notification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border: 1px solid #dddddd;
      border-radius: 5px;
      box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #ff4500;
      color: #ffffff;
      padding: 10px 20px;
      border-top-left-radius: 5px;
      border-top-right-radius: 5px;
      text-align: center;
      font-size: 24px;
    }
    .content {
      padding: 20px;
      color: #555555;
      line-height: 1.6;
    }
    .content strong {
      color: #333333;
    }
    .footer {
      padding: 10px 20px;
      background-color: #f4f4f4;
      border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px;
      text-align: center;
      font-size: 12px;
      color: #aaaaaa;
    }
    .button {
      display: block;
      width: 200px;
      margin: 20px auto;
      padding: 10px;
      background-color: #ff4500;
      color: #ffffff;
      text-align: center;
      border-radius: 5px;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <!-- User Notification -->
  <table>
    <tr>
      <td class="header">
        Bio Data Inactivation Notification
      </td>
    </tr>
    <tr>
      <td class="content">
        <p>Dear <strong>Sir/Mam</strong>,</p>
        <p>We have received your request to inactivate your bio data. Your bio data is now inactive and will not be visible to others.</p>
        <p>If you have any questions or wish to reactivate your bio data, please contact support.</p>
      </td>
    </tr>
    <tr>
      <td class="footer">
        &copy; 2024 PNC Nikah. All rights reserved.
      </td>
    </tr>
  </table>
</body>
</html>
      `;
      const userHtml = `
      <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bio Data Inactivation Notification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border: 1px solid #dddddd;
      border-radius: 5px;
      box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #ff4500;
      color: #ffffff;
      padding: 10px 20px;
      border-top-left-radius: 5px;
      border-top-right-radius: 5px;
      text-align: center;
      font-size: 24px;
    }
    .content {
      padding: 20px;
      color: #555555;
      line-height: 1.6;
    }
    .content strong {
      color: #333333;
    }
    .footer {
      padding: 10px 20px;
      background-color: #f4f4f4;
      border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px;
      text-align: center;
      font-size: 12px;
      color: #aaaaaa;
    }
    .button {
      display: block;
      width: 200px;
      margin: 20px auto;
      padding: 10px;
      background-color: #ff4500;
      color: #ffffff;
      text-align: center;
      border-radius: 5px;
      text-decoration: none;
    }
  </style>
</head>
<body>
    <!-- Admin Notification -->
  <table>
    <tr>
      <td class="header">
        Admin Notification
      </td>
    </tr>
    <tr>
      <td class="content">
        <p>Dear Admin,</p>
        <p>The user <strong>${updatedUserInfo?.email}</strong> has requested to inactivate their bio data. Their bio data is now inactive and will not be visible to others.</p>
        <p>Please take any necessary actions to update their status in the system.</p>
      </td>
    </tr>
    <tr>
      <td class="footer">
        &copy; 2024 Your Company. All rights reserved.
      </td>
    </tr>
  </table>
</body>
</html>
      `;
      await sendEmails(adminEmails, " Admin Notification", adminHtml);
      await sendEmail(
        updatedUserInfo?.email,
        "Status Change Notification",
        userHtml
      );
    }

    res.status(httpStatus.OK).json({
      success: true,
      message: "User info updated successfully",
      data: updatedUserInfo,
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
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "User info not found",
      });
    }
    // admin
    const adminHtml = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bio Data Inactivation Notification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border: 1px solid #dddddd;
      border-radius: 5px;
      box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #ff4500;
      color: #ffffff;
      padding: 10px 20px;
      border-top-left-radius: 5px;
      border-top-right-radius: 5px;
      text-align: center;
      font-size: 24px;
    }
    .content {
      padding: 20px;
      color: #555555;
      line-height: 1.6;
    }
    .content strong {
      color: #333333;
    }
    .footer {
      padding: 10px 20px;
      background-color: #f4f4f4;
      border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px;
      text-align: center;
      font-size: 12px;
      color: #aaaaaa;
    }
    .button {
      display: block;
      width: 200px;
      margin: 20px auto;
      padding: 10px;
      background-color: #ff4500;
      color: #ffffff;
      text-align: center;
      border-radius: 5px;
      text-decoration: none;
    }
  </style>
</head>
<body>
    <table>
    <tr>
      <td class="header">
        Admin Notification
      </td>
    </tr>
    <tr>
      <td class="content">
        <p>Dear Admin,</p>
        <p>You have successfully updated the status of the user <strong>${
          updatedUserInfo?.email
        }</strong>.</p>
        <p><strong>New Status:</strong> ${updatedUserInfo?.user_status}</p>
        ${
          updatedUserInfo?.user_status === "active"
            ? " <p>The user account is now active. They can fully access all features of our platform.</p>"
            : updatedUserInfo?.user_status === "banned" &&
              "<p>The user account has been banned due to violations of our terms of service. Ensure all necessary actions are documented.</p>"
        }
        <p>Thank you for keeping the user data up-to-date.</p>
      </td>
    </tr>
    <tr>
      <td class="footer">
        &copy; 2024 PNC Nikah. All rights reserved.
      </td>
    </tr>
  </table>
  </body>
  </html>
  `;
    // user
    const userHtml = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bio Data Inactivation Notification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border: 1px solid #dddddd;
      border-radius: 5px;
      box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #ff4500;
      color: #ffffff;
      padding: 10px 20px;
      border-top-left-radius: 5px;
      border-top-right-radius: 5px;
      text-align: center;
      font-size: 24px;
    }
    .content {
      padding: 20px;
      color: #555555;
      line-height: 1.6;
    }
    .content strong {
      color: #333333;
    }
    .footer {
      padding: 10px 20px;
      background-color: #f4f4f4;
      border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px;
      text-align: center;
      font-size: 12px;
      color: #aaaaaa;
    }
    .button {
      display: block;
      width: 200px;
      margin: 20px auto;
      padding: 10px;
      background-color: #ff4500;
      color: #ffffff;
      text-align: center;
      border-radius: 5px;
      text-decoration: none;
    }
  </style>
</head>
<body>
    <table>
    <tr>
      <td class="header">
        Status Change Notification
      </td>
    </tr>
    <tr>
      <td class="content">
        <p>Dear <strong>Sir/Mam</strong>,</p>
        <p>Your bio data status has been reviewed and updated by the admin.</p>
        <p><strong>New Status:</strong> ${updatedUserInfo?.user_status}</p>
        
         ${
           updatedUserInfo?.user_status === "active"
             ? "<p>Congratulations! Your account is now active. You can fully access all features of our platform.</p>"
             : updatedUserInfo?.user_status === "banned" &&
               " <p>We regret to inform you that your account has been banned due to violations of our terms of service. Please contact support if you believe this is a mistake.</p>"
         }
        <p>If you have any questions, please contact support.</p>
      </td>
    </tr>
    <tr>
      <td class="footer">
        &copy; 2024 PNC Nikah. All rights reserved.
      </td>
    </tr>
  </table> </body> </html>
  `;
    await sendEmails(adminEmails, " Admin Notification", adminHtml);
    await sendEmail(
      updatedUserInfo?.email!,
      "Status Change Notification",
      userHtml
    );

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
