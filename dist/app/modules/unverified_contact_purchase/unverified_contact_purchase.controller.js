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
exports.UnverifiedContactPurchaseController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const unverified_contact_purchase_model_1 = __importDefault(require("./unverified_contact_purchase.model"));
const http_status_1 = __importDefault(require("http-status"));
const getMyPurchases = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        return res.status(http_status_1.default.UNAUTHORIZED).json({
            statusCode: http_status_1.default.UNAUTHORIZED,
            message: "You are not authorized",
            success: false,
        });
    }
    const purchases = yield unverified_contact_purchase_model_1.default.find({ user: userId })
        .populate("unverified_biodata", "bio_type gender date_of_birth height blood_group religion zilla bio_id")
        .sort({ createdAt: -1 });
    res.status(http_status_1.default.OK).json({
        success: true,
        data: purchases,
    });
}));
const getPurchaseById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const { id } = req.params;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
    if (!userId) {
        return res.status(http_status_1.default.UNAUTHORIZED).json({
            statusCode: http_status_1.default.UNAUTHORIZED,
            message: "You are not authorized",
            success: false,
        });
    }
    const purchase = yield unverified_contact_purchase_model_1.default.findOne({
        _id: id,
        user: userId,
    })
        .populate("unverified_biodata")
        .populate("user", "user_id email");
    if (!purchase) {
        return res.status(http_status_1.default.NOT_FOUND).json({
            statusCode: http_status_1.default.NOT_FOUND,
            message: "Purchase not found",
            success: false,
        });
    }
    res.status(http_status_1.default.OK).json({
        success: true,
        data: purchase,
    });
}));
exports.UnverifiedContactPurchaseController = {
    getMyPurchases,
    getPurchaseById,
};
