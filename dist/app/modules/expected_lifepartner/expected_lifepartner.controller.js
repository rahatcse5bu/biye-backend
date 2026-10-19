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
// TODO: fields a client must never set: ownership, ids and form bookkeeping.
const stripProtected = (body) => {
    const _a = body || {}, { user, _id, __v, user_form } = _a, fields = __rest(_a, ["user", "_id", "__v", "user_form"]);
    return fields;
};
// TODO: bad input (wrong types, invalid values) is the client's mistake, not a server error.
const isInputError = (error) => (error === null || error === void 0 ? void 0 : error.name) === "ValidationError" || (error === null || error === void 0 ? void 0 : error.name) === "CastError";
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
        var _a, _b, _c, _d;
        const user_form = (_a = req.body) === null || _a === void 0 ? void 0 : _a.user_form;
        const fields = stripProtected(req.body);
        // TODO: one attempt = upsert the record + update the form timeline, all-or-nothing.
        const attempt = () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                const result = yield expected_lifepartner_services_1.ExpectedPartnerService.upsertExpectedPartner(String((_a = req.user) === null || _a === void 0 ? void 0 : _a._id), fields, { session });
                const user = yield user_info_model_1.UserInfoModel.findById((_b = req.user) === null || _b === void 0 ? void 0 : _b._id).session(session);
                user.edited_timeline_index = Math.max(user.edited_timeline_index, user_form);
                user.last_edited_timeline_index = user_form;
                yield user.save({ session });
                yield session.commitTransaction();
                return result;
            }
            catch (error) {
                yield session.abortTransaction();
                throw error;
            }
            finally {
                session.endSession();
            }
        });
        try {
            let result;
            // TODO: MongoDB asks to retry transactions that hit a transient conflict (e.g. two saves at once).
            for (let tries = 1;; tries++) {
                try {
                    result = yield attempt();
                    break;
                }
                catch (error) {
                    const transient = ((_c = (_b = error === null || error === void 0 ? void 0 : error.errorLabels) === null || _b === void 0 ? void 0 : _b.includes) === null || _c === void 0 ? void 0 : _c.call(_b, "TransientTransactionError")) || ((_d = error === null || error === void 0 ? void 0 : error.hasErrorLabel) === null || _d === void 0 ? void 0 : _d.call(error, "TransientTransactionError"));
                    if (!transient || tries >= 5)
                        throw error;
                    // TODO: random backoff so simultaneous saves stop colliding on the retry.
                    yield new Promise((resolve) => setTimeout(resolve, 40 * tries + Math.random() * 80));
                }
            }
            res.status(result.created ? http_status_1.default.CREATED : http_status_1.default.OK).json({
                success: true,
                message: result.created ? "ExpectedPartner created successfully" : "ExpectedPartner updated successfully",
                data: result.record,
            });
        }
        catch (error) {
            if (isInputError(error)) {
                return res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: `Invalid data: ${error.message}` });
            }
            console.error("Expected partner create failed:", error);
            res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "An error occurred while creating the expectedPartner",
            });
        }
    })),
    updateExpectedPartner: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!id) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        let updatedExpectedPartner;
        try {
            updatedExpectedPartner = yield expected_lifepartner_services_1.ExpectedPartnerService.updateExpectedPartner(id, stripProtected(req.body));
        }
        catch (error) {
            if (!isInputError(error))
                throw error;
            return res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: `Invalid data: ${error.message}` });
        }
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
