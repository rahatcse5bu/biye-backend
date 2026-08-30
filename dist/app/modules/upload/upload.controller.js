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
exports.UploadController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const ApiError_1 = __importDefault(require("../../middlewares/ApiError"));
const upload_service_1 = require("./upload.service");
const uploadImages = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "You are not authorized");
    }
    const files = req.files;
    if (!(files === null || files === void 0 ? void 0 : files.length)) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "At least one image is required");
    }
    const urls = yield upload_service_1.UploadService.uploadProfileImages(files, String(userId));
    res.status(http_status_1.default.CREATED).json({
        success: true,
        message: "Images uploaded successfully",
        data: { urls },
    });
}));
const deleteImage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "You are not authorized");
    }
    if (typeof ((_c = req.body) === null || _c === void 0 ? void 0 : _c.url) !== "string" || !req.body.url.trim()) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Image URL is required");
    }
    yield upload_service_1.UploadService.deleteProfileImage(req.body.url, String(userId));
    res.status(http_status_1.default.OK).json({
        success: true,
        message: "Image deleted successfully",
    });
}));
exports.UploadController = {
    uploadImages,
    deleteImage,
};
