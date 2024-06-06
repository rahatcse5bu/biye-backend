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
exports.ExpectedPartnerController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const user_info_model_1 = require("../user_info/user_info.model");
const mongoose_1 = __importDefault(require("mongoose"));
const expected_lifepartner_services_1 = require("./expected_lifepartner.services");
exports.ExpectedPartnerController = {
    getAllExpectedPartners: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const expectedPartners = yield expected_lifepartner_services_1.ExpectedPartnerService.getAllExpectedPartners();
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "All expectedPartners retrieved successfully",
            data: expectedPartners,
        });
    })),
    getExpectedPartnerById: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const id = req.params.id;
        const expectedPartner = yield expected_lifepartner_services_1.ExpectedPartnerService.getExpectedPartnerById(id);
        if (!expectedPartner) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "ExpectedPartner not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "ExpectedPartner retrieved successfully",
                data: expectedPartner,
            });
        }
    })),
    getExpectedPartnerByToken: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const expectedPartner = yield expected_lifepartner_services_1.ExpectedPartnerService.getExpectedPartnerByToken(userId);
        if (!expectedPartner) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "ExpectedPartner not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "ExpectedPartner retrieved successfully",
                data: expectedPartner,
            });
        }
    })),
    createExpectedPartner: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _b, _c;
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            let _d = req.body, { user_form } = _d, expectedPartnerData = __rest(_d, ["user_form"]);
            expectedPartnerData.user = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
            // Create expectedPartner
            const createdExpectedPartner = yield expected_lifepartner_services_1.ExpectedPartnerService.createExpectedPartner(expectedPartnerData, {
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
                message: "ExpectedPartner created successfully",
                data: createdExpectedPartner,
            });
        }
        catch (error) {
            // If any error occurs, abort the transaction
            yield session.abortTransaction();
            session.endSession();
            res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "An error occurred while creating the expectedPartner",
                error: error.message,
            });
        }
    })),
    updateExpectedPartner: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const updatedExpectedPartner = yield expected_lifepartner_services_1.ExpectedPartnerService.updateExpectedPartner(id, updatedFields);
        if (!updatedExpectedPartner) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "ExpectedPartner not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "ExpectedPartner updated successfully",
                data: updatedExpectedPartner,
            });
        }
    })),
    deleteExpectedPartner: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const id = req.params.id;
        yield expected_lifepartner_services_1.ExpectedPartnerService.deleteExpectedPartner(id);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "ExpectedPartner deleted successfully",
        });
    })),
};
