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
exports.UploadService = void 0;
const crypto_1 = require("crypto");
const cloudinary_1 = require("cloudinary");
const config_1 = __importDefault(require("../../../config"));
const ApiError_1 = __importDefault(require("../../middlewares/ApiError"));
const PROFILE_PHOTO_ROOT = "biye/profile-photos";
const getCloudinary = () => {
    if (!config_1.default.cloudinary_cloud_name ||
        !config_1.default.cloudinary_api_key ||
        !config_1.default.cloudinary_api_secret) {
        throw new ApiError_1.default(500, "Cloudinary is not configured");
    }
    cloudinary_1.v2.config({
        cloud_name: config_1.default.cloudinary_cloud_name,
        api_key: config_1.default.cloudinary_api_key,
        api_secret: config_1.default.cloudinary_api_secret,
        secure: true,
    });
    return cloudinary_1.v2;
};
const uploadBuffer = (buffer, folder) => {
    const client = getCloudinary();
    return new Promise((resolve, reject) => {
        const stream = client.uploader.upload_stream({
            folder,
            public_id: (0, crypto_1.randomUUID)(),
            resource_type: "image",
            overwrite: false,
            transformation: [
                {
                    width: 1600,
                    height: 1600,
                    crop: "limit",
                    quality: "auto:good",
                },
            ],
        }, (error, result) => {
            if (error || !result) {
                reject(error || new Error("Cloudinary did not return an upload result"));
                return;
            }
            resolve(result);
        });
        stream.end(buffer);
    });
};
const uploadProfileImages = (files, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const folder = `${PROFILE_PHOTO_ROOT}/${userId}`;
    const uploaded = [];
    try {
        for (const file of files) {
            uploaded.push(yield uploadBuffer(file.buffer, folder));
        }
        return uploaded.map((image) => image.secure_url);
    }
    catch (error) {
        const client = getCloudinary();
        yield Promise.allSettled(uploaded.map((image) => client.uploader.destroy(image.public_id, {
            resource_type: "image",
            invalidate: true,
        })));
        throw new ApiError_1.default(502, "Image upload failed");
    }
});
const extractOwnedPublicId = (imageUrl, userId) => {
    let parsedUrl;
    try {
        parsedUrl = new URL(imageUrl);
    }
    catch (_a) {
        throw new ApiError_1.default(400, "Invalid image URL");
    }
    if (parsedUrl.hostname !== "res.cloudinary.com") {
        throw new ApiError_1.default(400, "Only Cloudinary images can be deleted");
    }
    const segments = parsedUrl.pathname.split("/").filter(Boolean);
    if (segments[0] !== config_1.default.cloudinary_cloud_name) {
        throw new ApiError_1.default(403, "Image does not belong to this application");
    }
    const uploadIndex = segments.indexOf("upload");
    const versionIndex = segments.findIndex((segment, index) => index > uploadIndex && /^v\d+$/.test(segment));
    if (uploadIndex < 0 || versionIndex < 0 || versionIndex === segments.length - 1) {
        throw new ApiError_1.default(400, "Invalid Cloudinary image URL");
    }
    const publicIdSegments = segments.slice(versionIndex + 1).map(decodeURIComponent);
    const lastSegment = publicIdSegments.pop();
    if (!lastSegment) {
        throw new ApiError_1.default(400, "Invalid Cloudinary image URL");
    }
    publicIdSegments.push(lastSegment.replace(/\.[^.]+$/, ""));
    const publicId = publicIdSegments.join("/");
    const ownedFolder = `${PROFILE_PHOTO_ROOT}/${userId}/`;
    if (!publicId.startsWith(ownedFolder)) {
        throw new ApiError_1.default(403, "You cannot delete this image");
    }
    return publicId;
};
const deleteProfileImage = (imageUrl, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const publicId = extractOwnedPublicId(imageUrl, userId);
    const result = yield getCloudinary().uploader.destroy(publicId, {
        resource_type: "image",
        invalidate: true,
    });
    if (result.result !== "ok" && result.result !== "not found") {
        throw new ApiError_1.default(502, "Image deletion failed");
    }
});
exports.UploadService = {
    uploadProfileImages,
    deleteProfileImage,
};
