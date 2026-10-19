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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPEN_STATUSES = exports.REVISION_STATUSES = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.REVISION_STATUSES = ["draft", "pending", "approved", "rejected", "withdrawn"];
exports.OPEN_STATUSES = ["draft", "pending"];
// TODO: every edit to a published biodata lands here; admins approve (applied to the live sections) or reject it.
const BiodataRevisionSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: exports.REVISION_STATUSES, default: "draft", index: true },
    changes: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    previous: { type: mongoose_1.Schema.Types.Mixed, default: null },
    submitted_at: { type: Date, default: null },
    reviewed_at: { type: Date, default: null },
    reviewed_by: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", default: null },
    admin_note: { type: String, trim: true, default: "" },
}, { timestamps: true, minimize: false });
// TODO: at most one open (draft or pending) revision per user.
BiodataRevisionSchema.index({ user: 1 }, { unique: true, partialFilterExpression: { status: { $in: exports.OPEN_STATUSES } }, name: "one_open_revision_per_user" });
BiodataRevisionSchema.index({ status: 1, submitted_at: -1 });
const BiodataRevision = mongoose_1.default.model("BiodataRevision", BiodataRevisionSchema);
exports.default = BiodataRevision;
