"use strict";
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
        var _a;
        const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!id) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const _b = req.body, { points, user_role } = _b, others = __rest(_b, ["points", "user_role"]);
        const userInfo = others;
        const updatedUserInfo = yield user_info_services_1.UserInfoService.updateUserInfo(id, userInfo);
        if (!updatedUserInfo) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "User info not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "User info updated successfully",
                data: updatedUserInfo,
            });
        }
    })),
    verifyTokenByUser: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _c;
        const id = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id;
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
