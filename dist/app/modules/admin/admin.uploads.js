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
exports.UploadsController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const mongoose_1 = require("mongoose");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const upload_service_1 = require("../upload/upload.service");
const user_info_model_1 = require("../user_info/user_info.model");
const general_info_model_1 = __importDefault(require("../general_info/general_info.model"));
const biodata_revision_model_1 = __importDefault(require("../biodata_revision/biodata_revision.model"));
const notification_service_1 = require("../notifications/notification.service");
const ROOT = `${upload_service_1.UploadService.PROFILE_PHOTO_ROOT}/`;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ownerOf = (publicId) => publicId.slice(ROOT.length).split("/")[0];
const strings = (value) => (Array.isArray(value) ? value.filter((v) => typeof v === "string") : []);
// TODO: one page of uploaded profile photos with their owner and whether the profile actually uses them.
const listUploads = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
    const biodata = String(req.query.biodata || "").trim();
    let prefix = ROOT;
    if (biodata) {
        const owner = /^\d+$/.test(biodata) ? yield user_info_model_1.UserInfoModel.findOne({ user_id: Number(biodata) }).select("_id").lean() : null;
        if (!owner)
            return res.status(http_status_1.default.OK).json({ success: true, data: [], next_cursor: null });
        prefix = `${ROOT}${owner._id}/`;
    }
    // TODO: the Search API (unlike api.resources) can sort by upload time, so newest uploads come first.
    let search = upload_service_1.UploadService.getCloudinary()
        .search.expression(`resource_type:image AND public_id:${prefix}*`)
        .sort_by("created_at", "desc")
        .max_results(30);
    if (cursor)
        search = search.next_cursor(cursor);
    const result = yield search.execute();
    const resources = result.resources || [];
    const ownerIds = [...new Set(resources.map((r) => ownerOf(r.public_id)).filter(mongoose_1.isValidObjectId))];
    const [users, infos, revisions] = yield Promise.all([
        user_info_model_1.UserInfoModel.find({ _id: { $in: ownerIds } }).select("user_id email user_status").lean(),
        general_info_model_1.default.find({ user: { $in: ownerIds } }).select("user photos approved_data.photos").lean(),
        biodata_revision_model_1.default.find({ user: { $in: ownerIds }, status: { $in: ["draft", "pending"] } }).select("user changes.general_info.photos").lean(),
    ]);
    const byId = (rows, key) => new Map(rows.map((row) => [String(row[key]), row]));
    const userMap = byId(users, "_id");
    const infoMap = byId(infos, "user");
    const revisionMap = byId(revisions, "user");
    const data = resources.map((r) => {
        var _a, _b, _c, _d;
        const owner = ownerOf(r.public_id);
        const info = infoMap.get(owner);
        const live = [...strings((_a = info === null || info === void 0 ? void 0 : info.approved_data) === null || _a === void 0 ? void 0 : _a.photos), ...strings(info === null || info === void 0 ? void 0 : info.photos)];
        const staged = strings((_d = (_c = (_b = revisionMap.get(owner)) === null || _b === void 0 ? void 0 : _b.changes) === null || _c === void 0 ? void 0 : _c.general_info) === null || _d === void 0 ? void 0 : _d.photos);
        const uses = (list) => list.some((url) => url.includes(`/${r.public_id}.`));
        const user = userMap.get(owner);
        return {
            public_id: r.public_id,
            url: r.secure_url,
            thumbnail: r.secure_url.replace("/upload/", "/upload/c_fill,w_240,h_240,q_auto,f_auto/"),
            bytes: r.bytes,
            width: r.width,
            height: r.height,
            created_at: r.created_at,
            owner: user ? { _id: user._id, user_id: user.user_id, email: user.email, user_status: user.user_status } : null,
            status: uses(live) ? "live" : uses(staged) ? "pending" : "unused",
        };
    });
    res.status(http_status_1.default.OK).json({ success: true, data, total: (_a = result.total_count) !== null && _a !== void 0 ? _a : data.length, next_cursor: result.next_cursor || null });
}));
// TODO: removes the file and pulls it from the profile, so a moderated photo can't linger as a broken image.
const deleteUpload = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const publicId = String(((_a = req.body) === null || _a === void 0 ? void 0 : _a.public_id) || "");
    if (!publicId.startsWith(ROOT) || publicId.includes("..")) {
        return res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: "Not a profile photo" });
    }
    const reason = String(((_b = req.body) === null || _b === void 0 ? void 0 : _b.reason) || "").trim().slice(0, 300);
    const owner = ownerOf(publicId);
    const pattern = new RegExp(`/${escapeRegex(publicId)}\\.`);
    let wasLive = false;
    if ((0, mongoose_1.isValidObjectId)(owner)) {
        const update = yield general_info_model_1.default.updateOne({ user: owner }, { $pull: { photos: { $regex: pattern }, "approved_data.photos": { $regex: pattern } } });
        wasLive = update.modifiedCount > 0;
        yield biodata_revision_model_1.default.updateMany({ user: owner, status: { $in: ["draft", "pending"] } }, { $pull: { "changes.general_info.photos": { $regex: pattern } } });
    }
    const result = yield upload_service_1.UploadService.getCloudinary().uploader.destroy(publicId, { resource_type: "image", invalidate: true });
    if (result.result !== "ok" && result.result !== "not found") {
        return res.status(http_status_1.default.BAD_GATEWAY).json({ success: false, message: "Cloudinary could not delete the image" });
    }
    if (wasLive) {
        notification_service_1.NotificationService.notify({
            recipient: owner,
            audience: "user",
            type: "moderation",
            title: "একটি ছবি সরানো হয়েছে",
            message: reason
                ? `আপনার বায়োডাটার একটি ছবি সরানো হয়েছে। কারণ: ${reason}`
                : "আপনার বায়োডাটার একটি ছবি নিয়ম অনুযায়ী না হওয়ায় সরানো হয়েছে।",
            link: "/user/account/edit-biodata",
        });
    }
    res.status(http_status_1.default.OK).json({ success: true, message: "Photo deleted", removed_from_profile: wasLive });
}));
exports.UploadsController = { listUploads, deleteUpload };
