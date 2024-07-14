"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserInfoController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const user_info_services_1 = require("./user_info.services");
const ApiError_1 = __importDefault(require("../../middlewares/ApiError"));
const user_info_constant_1 = require("./user_info.constant");
const SendEmail_1 = __importStar(require("../../../shared/SendEmail"));
exports.UserInfoController = {
    getAllUserInfo: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const userInfo = yield user_info_services_1.UserInfoService.getAllUserInfo();
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "All user info retrieved successfully",
            data: userInfo,
        });
    })),
    getUserInfoById: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const id = req.params.id;
        const userInfo = yield user_info_services_1.UserInfoService.getUserInfoById(id);
        if (!userInfo) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "User info not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "User info retrieved successfully",
                data: userInfo,
            });
        }
    })),
    getUserStatus: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const id = req.params.id;
        const userStatus = yield user_info_services_1.UserInfoService.getUserStatus(id);
        if (!userStatus) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "User info not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "User info retrieved successfully",
                data: userStatus,
            });
        }
    })),
    getUserInfoByEmail: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const email = req.params.email;
        const userInfo = yield user_info_services_1.UserInfoService.getUserInfoByEmail(email);
        if (!userInfo) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        else {
            res.status(200).json({
                message: "User retrieved successfully",
                success: true,
                data: userInfo,
            });
        }
    })),
    createUserInfo: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const userInfo = req.body;
        const createdUserInfo = yield user_info_services_1.UserInfoService.createUserInfo(userInfo);
        res.status(http_status_1.default.CREATED).json({
            success: true,
            message: "User info created successfully",
            data: createdUserInfo,
        });
    })),
    createUserForGoogleSignIn: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const userInfo = req.body;
        if ((req === null || req === void 0 ? void 0 : req.user) && (req === null || req === void 0 ? void 0 : req.user.email) !== (userInfo === null || userInfo === void 0 ? void 0 : userInfo.email)) {
            throw new ApiError_1.default(401, "You are not allowed to access this");
        }
        const createdUserInfo = yield user_info_services_1.UserInfoService.createUserForGoogleSignIn(userInfo);
        res.status(http_status_1.default.CREATED).json({
            success: true,
            message: "User info created successfully",
            data: createdUserInfo,
        });
    })),
    updateUserInfo: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!id) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const _j = req.body, { points, user_role } = _j, others = __rest(_j, ["points", "user_role"]);
        if ((others === null || others === void 0 ? void 0 : others.userRole) && !user_info_constant_1.userRoleChangeByUser.includes(others)) {
            throw new ApiError_1.default(403, "You are not allowed to change user role");
        }
        const userInfo = others;
        const updatedUserInfo = yield user_info_services_1.UserInfoService.updateUserInfo(id, userInfo);
        if (!updatedUserInfo) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "User info not found",
            });
        }
        if ((others === null || others === void 0 ? void 0 : others.user_status) === "in review") {
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
            <p>The user <strong>${(_b = req.user) === null || _b === void 0 ? void 0 : _b.email}</strong> has submitted their bio data for review.</p>
            <p><strong>Current Status:</strong> ${(_c = req.user) === null || _c === void 0 ? void 0 : _c.user_status}</p>
            <p><strong>Submitted Data:</strong></p>
            <ul>
              ${req.body &&
                Object.keys(req.body).length &&
                Object.keys(req.body)
                    .map((field) => `<li>${field.name}: ${field.value}</li>`)
                    .join("")}
            </ul>
            <p>Please review the data and update the user status accordingly.</p>
            <a href="https://admin.pnc-nikah.com/details/${(_d = req.user) === null || _d === void 0 ? void 0 : _d.user_id}" class="button">Review Now</a>
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
            <p><strong>Current Status:</strong> ${(_e = req.user) === null || _e === void 0 ? void 0 : _e.user_status}</p>
            <p><strong>Submitted Data:</strong></p>
            <ul>
              ${req.body &&
                Object.keys(req.body).length &&
                Object.keys(req.body)
                    .map((field) => `<li>${field.name}: ${field.value}</li>`)
                    .join("")}
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
            yield (0, SendEmail_1.sendEmails)(user_info_constant_1.adminEmails, " Admin Notification", adminHtml);
            yield (0, SendEmail_1.default)((_f = req.user) === null || _f === void 0 ? void 0 : _f.email, "Status Change Notification", userHtml);
        }
        else if ((others === null || others === void 0 ? void 0 : others.user_status) === "inactive") {
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
        <p>The user <strong>${(_g = req.user) === null || _g === void 0 ? void 0 : _g.email}</strong> has requested to inactivate their bio data. Their bio data is now inactive and will not be visible to others.</p>
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
            yield (0, SendEmail_1.sendEmails)(user_info_constant_1.adminEmails, " Admin Notification", adminHtml);
            yield (0, SendEmail_1.default)((_h = req.user) === null || _h === void 0 ? void 0 : _h.email, "Status Change Notification", userHtml);
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "User info updated successfully",
            data: updatedUserInfo,
        });
    })),
    updateUserInfoByAdmin: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _k;
        const id = (_k = req.user) === null || _k === void 0 ? void 0 : _k._id;
        const bioId = req.params.bioId;
        if (!id) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const userInfo = req.body;
        const updatedUserInfo = yield user_info_services_1.UserInfoService.updateUserInfo(bioId, userInfo);
        if (!updatedUserInfo) {
            res.status(http_status_1.default.NOT_FOUND).json({
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
        <p>You have successfully updated the status of the user <strong>${updatedUserInfo === null || updatedUserInfo === void 0 ? void 0 : updatedUserInfo.email}</strong>.</p>
        <p><strong>New Status:</strong> ${updatedUserInfo === null || updatedUserInfo === void 0 ? void 0 : updatedUserInfo.user_status}</p>
        ${(updatedUserInfo === null || updatedUserInfo === void 0 ? void 0 : updatedUserInfo.user_status) === "active"
            ? " <p>The user account is now active. They can fully access all features of our platform.</p>"
            : (updatedUserInfo === null || updatedUserInfo === void 0 ? void 0 : updatedUserInfo.user_status) === "banned" &&
                "<p>The user account has been banned due to violations of our terms of service. Ensure all necessary actions are documented.</p>"}
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
        <p><strong>New Status:</strong> ${updatedUserInfo === null || updatedUserInfo === void 0 ? void 0 : updatedUserInfo.user_status}</p>
        
         ${(updatedUserInfo === null || updatedUserInfo === void 0 ? void 0 : updatedUserInfo.user_status) === "active"
            ? "<p>Congratulations! Your account is now active. You can fully access all features of our platform.</p>"
            : (updatedUserInfo === null || updatedUserInfo === void 0 ? void 0 : updatedUserInfo.user_status) === "banned" &&
                " <p>We regret to inform you that your account has been banned due to violations of our terms of service. Please contact support if you believe this is a mistake.</p>"}
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
        yield (0, SendEmail_1.sendEmails)(user_info_constant_1.adminEmails, " Admin Notification", adminHtml);
        yield (0, SendEmail_1.default)(updatedUserInfo === null || updatedUserInfo === void 0 ? void 0 : updatedUserInfo.email, "Status Change Notification", userHtml);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "User info updated successfully",
            data: updatedUserInfo,
        });
    })),
    verifyTokenByUser: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _l;
        const id = (_l = req.user) === null || _l === void 0 ? void 0 : _l._id;
        if (!id) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        res.json({
            success: true,
            data: req.user,
        });
    })),
    getAllUsersInfoId: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const userInfo = yield user_info_services_1.UserInfoService.getAllUsersInfoId();
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "All user info retrieved successfully",
            data: userInfo,
        });
    })),
    deleteUserInfo: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const id = req.params.id;
        yield user_info_services_1.UserInfoService.deleteUserInfo(id);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "User info deleted successfully",
        });
    })),
};
