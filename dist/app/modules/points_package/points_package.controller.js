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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointsPackageController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const mongoose_1 = require("mongoose");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const points_package_service_1 = require("./points_package.service");
// TODO: returns cleaned fields or an error message; `partial` allows missing fields on update.
const parseInput = (body, partial) => {
    const data = {};
    if (body.name !== undefined || !partial) {
        if (typeof body.name !== "string" || !body.name.trim()) {
            return { error: "Package name is required" };
        }
        data.name = body.name.trim();
    }
    if (body.price !== undefined || !partial) {
        const price = Number(body.price);
        if (!Number.isFinite(price) || price < 1) {
            return { error: "Price must be at least 1" };
        }
        data.price = price;
    }
    if (body.points !== undefined || !partial) {
        const points = Number(body.points);
        if (!Number.isFinite(points) || points < 0) {
            return { error: "Points must be 0 or more" };
        }
        data.points = points;
    }
    if (body.features !== undefined) {
        if (!Array.isArray(body.features)) {
            return { error: "Features must be a list" };
        }
        data.features = body.features
            .filter((item) => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean);
    }
    if (body.is_active !== undefined)
        data.is_active = Boolean(body.is_active);
    if (body.sort_order !== undefined) {
        const sortOrder = Number(body.sort_order);
        if (!Number.isFinite(sortOrder))
            return { error: "Sort order must be a number" };
        data.sort_order = sortOrder;
    }
    return { data };
};
const duplicatePriceResponse = (res) => res.status(http_status_1.default.CONFLICT).json({
    success: false,
    message: "Another package already uses this price",
});
exports.PointsPackageController = {
    listActive: (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const packages = yield points_package_service_1.PointsPackageService.listActive();
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Points packages retrieved successfully",
            data: packages,
        });
    })),
    listAll: (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const packages = yield points_package_service_1.PointsPackageService.listAll();
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Points packages retrieved successfully",
            data: packages,
        });
    })),
    create: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { data, error } = parseInput(req.body || {}, false);
        if (error) {
            res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: error });
            return;
        }
        try {
            const created = yield points_package_service_1.PointsPackageService.create(data);
            res.status(http_status_1.default.CREATED).json({
                success: true,
                message: "Points package created successfully",
                data: created,
            });
        }
        catch (err) {
            if ((err === null || err === void 0 ? void 0 : err.code) === 11000) {
                duplicatePriceResponse(res);
                return;
            }
            throw err;
        }
    })),
    update: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        if (!(0, mongoose_1.isValidObjectId)(req.params.id)) {
            res.status(http_status_1.default.NOT_FOUND).json({ success: false, message: "Package not found" });
            return;
        }
        const { data, error } = parseInput(req.body || {}, true);
        if (error) {
            res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: error });
            return;
        }
        try {
            const updated = yield points_package_service_1.PointsPackageService.update(req.params.id, data);
            if (!updated) {
                res.status(http_status_1.default.NOT_FOUND).json({ success: false, message: "Package not found" });
                return;
            }
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "Points package updated successfully",
                data: updated,
            });
        }
        catch (err) {
            if ((err === null || err === void 0 ? void 0 : err.code) === 11000) {
                duplicatePriceResponse(res);
                return;
            }
            throw err;
        }
    })),
    getCustomSettings: (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const settings = yield points_package_service_1.PointsPackageService.getCustomSettings();
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Custom points settings retrieved successfully",
            data: settings,
        });
    })),
    updateCustomSettings: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        const body = req.body || {};
        const current = yield points_package_service_1.PointsPackageService.getCustomSettings();
        const next = {
            enabled: body.enabled === undefined ? current.enabled : Boolean(body.enabled),
            points_per_taka: Number((_a = body.points_per_taka) !== null && _a !== void 0 ? _a : current.points_per_taka),
            min_amount: Number((_b = body.min_amount) !== null && _b !== void 0 ? _b : current.min_amount),
            max_amount: Number((_c = body.max_amount) !== null && _c !== void 0 ? _c : current.max_amount),
        };
        let error = "";
        if (!Number.isFinite(next.points_per_taka) || next.points_per_taka <= 0) {
            error = "Points per taka must be greater than 0";
        }
        else if (!Number.isInteger(next.min_amount) || next.min_amount < 1) {
            error = "Minimum amount must be a whole number of at least 1";
        }
        else if (!Number.isInteger(next.max_amount) || next.max_amount < next.min_amount) {
            error = "Maximum amount must be a whole number not less than the minimum";
        }
        if (error) {
            res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: error });
            return;
        }
        const settings = yield points_package_service_1.PointsPackageService.updateCustomSettings(next);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Custom points settings updated successfully",
            data: settings,
        });
    })),
    remove: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const deleted = (0, mongoose_1.isValidObjectId)(req.params.id)
            ? yield points_package_service_1.PointsPackageService.remove(req.params.id)
            : null;
        if (!deleted) {
            res.status(http_status_1.default.NOT_FOUND).json({ success: false, message: "Package not found" });
            return;
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Points package deleted successfully",
        });
    })),
};
