"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const express_1 = __importDefault(require("express"));
const http_status_1 = __importDefault(require("http-status"));
const mongoose_1 = require("mongoose");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const auth_1 = require("../../middlewares/auth");
const contact_message_model_1 = __importStar(require("./contact_message.model"));
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const router = express_1.default.Router();
router.use((0, auth_1.auth)("admin"));
router.get("/", (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const status = String(req.query.status || "");
    const search = String(req.query.search || "").trim().slice(0, 100);
    const filter = {};
    if (contact_message_model_1.CONTACT_MESSAGE_STATUSES.includes(status))
        filter.status = status;
    if (search) {
        const pattern = new RegExp(escapeRegex(search), "i");
        filter.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }, { bio: pattern }, { message: pattern }];
    }
    const [items, total] = yield Promise.all([
        contact_message_model_1.default.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        contact_message_model_1.default.countDocuments(filter),
    ]);
    res.status(http_status_1.default.OK).json({
        success: true,
        data: items,
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
    });
})));
router.get("/unread-count", (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const count = yield contact_message_model_1.default.countDocuments({ status: "new" });
    res.status(http_status_1.default.OK).json({ success: true, data: { count } });
})));
router.patch("/:id", (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status } = req.body || {};
    if (!(0, mongoose_1.isValidObjectId)(req.params.id) || !contact_message_model_1.CONTACT_MESSAGE_STATUSES.includes(status)) {
        return res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: "Invalid message or status" });
    }
    const updated = yield contact_message_model_1.default.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean();
    if (!updated) {
        return res.status(http_status_1.default.NOT_FOUND).json({ success: false, message: "Message not found" });
    }
    res.status(http_status_1.default.OK).json({ success: true, data: updated });
})));
router.delete("/:id", (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(0, mongoose_1.isValidObjectId)(req.params.id)) {
        return res.status(http_status_1.default.BAD_REQUEST).json({ success: false, message: "Invalid message" });
    }
    const deleted = yield contact_message_model_1.default.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
        return res.status(http_status_1.default.NOT_FOUND).json({ success: false, message: "Message not found" });
    }
    res.status(http_status_1.default.OK).json({ success: true, message: "Message deleted" });
})));
exports.default = router;
