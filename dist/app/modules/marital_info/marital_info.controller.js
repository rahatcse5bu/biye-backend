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
exports.MaritalInfoController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const user_info_model_1 = require("../user_info/user_info.model");
const mongoose_1 = __importDefault(require("mongoose"));
const marital_info_service_1 = require("./marital_info.service");
exports.MaritalInfoController = {
    getAllMaritalInfos: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const maritalInfos = yield marital_info_service_1.MaritalInfoService.getAllMaritalInfos();
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "All maritalInfos retrieved successfully",
            data: maritalInfos,
        });
    })),
    getMaritalInfoById: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const id = req.params.id;
        const maritalInfo = yield marital_info_service_1.MaritalInfoService.getMaritalInfoById(id);
        if (!maritalInfo) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "MaritalInfo not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "MaritalInfo retrieved successfully",
                data: maritalInfo,
            });
        }
    })),
    getMaritalInfoByToken: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const maritalInfo = yield marital_info_service_1.MaritalInfoService.getMaritalInfoByToken(userId);
        if (!maritalInfo) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "MaritalInfo not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "MaritalInfo retrieved successfully",
                data: maritalInfo,
            });
        }
    })),
    createMaritalInfo: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _b, _c;
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            let _d = req.body, { user_form } = _d, maritalInfoData = __rest(_d, ["user_form"]);
            maritalInfoData.user = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
            // Create maritalInfo
            const createdMaritalInfo = yield marital_info_service_1.MaritalInfoService.createMaritalInfo(maritalInfoData, {
                session,
            });
            // Find user and update the fields
            const user = yield user_info_model_1.UserInfoModel.findById((_c = req.user) === null || _c === void 0 ? void 0 : _c._id).session(session);
            user.edited_timeline_index = Math.max(user.edited_timeline_index, user_form);
            user.last_edited_timeline_index = user_form;
            yield user.save({ session });
            // Commit the transaction
            yield session.commitTransaction();
            session.endSession();
            res.status(http_status_1.default.CREATED).json({
                success: true,
                message: "MaritalInfo created successfully",
                data: createdMaritalInfo,
            });
        }
        catch (error) {
            // If any error occurs, abort the transaction
            yield session.abortTransaction();
            session.endSession();
            res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "An error occurred while creating the maritalInfo",
                error: error.message,
            });
        }
    })),
    updateMaritalInfo: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _e;
        const id = (_e = req.user) === null || _e === void 0 ? void 0 : _e._id;
        if (!id) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const updatedFields = req.body;
        const updatedMaritalInfo = yield marital_info_service_1.MaritalInfoService.updateMaritalInfo(id, updatedFields);
        if (!updatedMaritalInfo) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "MaritalInfo not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "MaritalInfo updated successfully",
                data: updatedMaritalInfo,
            });
        }
    })),
    deleteMaritalInfo: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const id = req.params.id;
        yield marital_info_service_1.MaritalInfoService.deleteMaritalInfo(id);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "MaritalInfo deleted successfully",
        });
    })),
};
