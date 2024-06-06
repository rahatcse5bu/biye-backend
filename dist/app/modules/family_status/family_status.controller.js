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
exports.FamilyStatusController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const mongoose_1 = __importDefault(require("mongoose"));
const family_status_service_1 = require("./family_status.service");
const user_info_model_1 = require("../user_info/user_info.model");
exports.FamilyStatusController = {
    getFamilyStatus: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const familyStatuses = yield family_status_service_1.FamilyStatusService.getAllFamilyStatuses();
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "All family statuses retrieved successfully",
            data: familyStatuses,
        });
    })),
    getSingleFamilyStatus: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const userId = req.params.id;
        const familyStatus = yield family_status_service_1.FamilyStatusService.getFamilyStatusById(userId);
        if (!familyStatus) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "Family status not found",
            });
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Family status retrieved successfully",
            data: familyStatus,
        });
    })),
    getFamilyStatusByUserId: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const userId = req.params.id;
        const familyStatus = yield family_status_service_1.FamilyStatusService.getFamilyStatusByUserId(userId);
        if (!familyStatus) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "Family status not found for the specified user_id",
            });
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Family status retrieved successfully",
            data: familyStatus,
        });
    })),
    getFamilyStatusByToken: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const familyStatus = yield family_status_service_1.FamilyStatusService.getFamilyStatusByUserId(userId);
        if (!familyStatus) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "Family status not found for the specified user_id",
            });
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Family status retrieved successfully",
            data: familyStatus,
        });
    })),
    createFamilyStatus: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
        let _c = req.body, { user_form } = _c, others = __rest(_c, ["user_form"]);
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                success: false,
                message: "You are not authorized",
            });
        }
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const user = yield user_info_model_1.UserInfoModel.findById(userId).session(session);
            if (!user) {
                throw new Error("User not found");
            }
            others.user = userId;
            const newFamilyStatus = yield family_status_service_1.FamilyStatusService.createFamilyStatus(others, session);
            user.edited_timeline_index = Math.max(user.edited_timeline_index, user_form);
            user.last_edited_timeline_index = user_form;
            yield user.save({ session });
            yield session.commitTransaction();
            session.endSession();
            res.status(http_status_1.default.CREATED).json({
                success: true,
                message: "Family status created  successfully",
                data: newFamilyStatus,
            });
        }
        catch (error) {
            yield session.abortTransaction();
            session.endSession();
            res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message,
            });
        }
    })),
    updateFamilyStatus: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _d;
        const data = req.body;
        if (!((_d = req.user) === null || _d === void 0 ? void 0 : _d._id)) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                success: false,
                message: "You are not authorized",
            });
        }
        const updatedQualification = yield family_status_service_1.FamilyStatusService.updateFamilyStatus(req.user._id, data);
        if (!updatedQualification) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "Family status not found",
            });
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Family status updated successfully",
            data: updatedQualification,
        });
    })),
    deleteFamilyStatus: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const userId = req.params.id;
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const deletedFamilyStatus = yield family_status_service_1.FamilyStatusService.deleteFamilyStatus(userId);
            if (!deletedFamilyStatus) {
                throw new Error("Family status not found");
            }
            yield session.commitTransaction();
            session.endSession();
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "Family status deleted successfully",
            });
        }
        catch (error) {
            yield session.abortTransaction();
            session.endSession();
            res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message,
            });
        }
    })),
};
