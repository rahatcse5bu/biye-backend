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
exports.OngikarNamaController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const user_info_model_1 = require("../user_info/user_info.model");
const mongoose_1 = __importDefault(require("mongoose"));
const ongikar_nama_service_1 = require("./ongikar_nama.service");
exports.OngikarNamaController = {
    getAllOngikarNamaes: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const ongikarNamaes = yield ongikar_nama_service_1.OngikarNamaService.getAllOngikarNamaes();
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "All ongikarNamaes retrieved successfully",
            data: ongikarNamaes,
        });
    })),
    getOngikarNamaById: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const id = req.params.id;
        const ongikarNama = yield ongikar_nama_service_1.OngikarNamaService.getOngikarNamaById(id);
        if (!ongikarNama) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "OngikarNama not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "OngikarNama retrieved successfully",
                data: ongikarNama,
            });
        }
    })),
    getOngikarNamaByToken: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        const ongikarNama = yield ongikar_nama_service_1.OngikarNamaService.getOngikarNamaByToken(userId);
        if (!ongikarNama) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "OngikarNama not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "OngikarNama retrieved successfully",
                data: ongikarNama,
            });
        }
    })),
    createOngikarNama: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _b, _c;
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            let _d = req.body, { user_form } = _d, ongikarNamaData = __rest(_d, ["user_form"]);
            ongikarNamaData.user = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
            // Create ongikarNama
            const createdOngikarNama = yield ongikar_nama_service_1.OngikarNamaService.createOngikarNama(ongikarNamaData, {
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
                message: "OngikarNama created successfully",
                data: createdOngikarNama,
            });
        }
        catch (error) {
            // If any error occurs, abort the transaction
            yield session.abortTransaction();
            session.endSession();
            res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "An error occurred while creating the ongikarNama",
                error: error.message,
            });
        }
    })),
    updateOngikarNama: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const updatedOngikarNama = yield ongikar_nama_service_1.OngikarNamaService.updateOngikarNama(id, updatedFields);
        if (!updatedOngikarNama) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "OngikarNama not found",
            });
        }
        else {
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "OngikarNama updated successfully",
                data: updatedOngikarNama,
            });
        }
    })),
    deleteOngikarNama: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const id = req.params.id;
        yield ongikar_nama_service_1.OngikarNamaService.deleteOngikarNama(id);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "OngikarNama deleted successfully",
        });
    })),
};
