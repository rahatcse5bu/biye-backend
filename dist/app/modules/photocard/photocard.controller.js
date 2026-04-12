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
exports.photocardController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const unverified_biodata_model_1 = __importDefault(require("../unverified_biodata/unverified_biodata.model"));
const photocardService_1 = require("../../../services/photocardService");
const photocard_template_model_1 = require("../photocard_template/photocard_template.model");
const http_status_1 = __importDefault(require("http-status"));
/**
 * Generate a promotional photocard for an unverified biodata
 * Supports optional template parameter to use custom SVG templates
 * Returns SVG data that can be rendered or downloaded
 */
const generatePhotocardForBiodata = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { biodataId } = req.params;
    const { templateId } = req.query;
    // Find the biodata - first try by MongoDB _id, then by bio_id (numeric)
    let biodata = null;
    // Try to find by MongoDB ObjectId if it's a valid format
    if (mongoose_1.default.Types.ObjectId.isValid(biodataId)) {
        biodata = yield unverified_biodata_model_1.default.findById(biodataId);
    }
    // If not found and biodataId is numeric, try to find by bio_id
    if (!biodata && !isNaN(Number(biodataId))) {
        biodata = yield unverified_biodata_model_1.default.findOne({ bio_id: Number(biodataId) });
    }
    if (!biodata) {
        return res.status(http_status_1.default.NOT_FOUND).json({
            success: false,
            message: "Biodata not found",
        });
    }
    try {
        let template = null;
        // Get template if specified
        if (templateId) {
            template = yield photocard_template_model_1.PhotocardTemplate.findById(templateId);
        }
        else {
            // Try to get default template for bio_type
            const bioType = ((_a = biodata.bio_type) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes("চাই")) ? "demand" : "supply";
            template = yield photocard_template_model_1.PhotocardTemplate.findOne({
                bioType,
                isActive: true,
            }).sort({ updatedAt: -1 });
        }
        // Generate the photocard SVG
        let svgContent;
        if (template) {
            svgContent = yield (0, photocardService_1.generatePhotocardWithTemplate)(biodata, biodata.bio_id.toString(), template);
        }
        else {
            svgContent = yield (0, photocardService_1.generatePhotocard)(biodata, biodata.bio_id.toString());
        }
        // Send as SVG
        res.status(http_status_1.default.OK).set("Content-Type", "image/svg+xml").send(svgContent);
    }
    catch (error) {
        console.error("[generatePhotocardForBiodata] Error:", error.message);
        return res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to generate photocard",
            error: error.message,
        });
    }
}));
/**
 * Get photocard as JSON data (for preview or manipulation before generation)
 */
const getPhotocardData = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { biodataId } = req.params;
    // Find the biodata - first try by MongoDB _id, then by bio_id (numeric)
    let biodata = null;
    // Try to find by MongoDB ObjectId if it's a valid format
    if (mongoose_1.default.Types.ObjectId.isValid(biodataId)) {
        biodata = yield unverified_biodata_model_1.default.findById(biodataId);
    }
    // If not found and biodataId is numeric, try to find by bio_id
    if (!biodata && !isNaN(Number(biodataId))) {
        biodata = yield unverified_biodata_model_1.default.findOne({ bio_id: Number(biodataId) });
    }
    if (!biodata) {
        return res.status(http_status_1.default.NOT_FOUND).json({
            success: false,
            message: "Biodata not found",
        });
    }
    try {
        // For now, just return biodata info
        // LLM extraction happens during SVG generation
        res.status(http_status_1.default.OK).json({
            success: true,
            data: {
                biodataId: biodata._id,
                bio_id: biodata.bio_id,
                bio_type: biodata.bio_type,
                gender: biodata.gender,
                age: biodata.date_of_birth
                    ? new Date().getFullYear() - new Date(biodata.date_of_birth).getFullYear()
                    : null,
                height: biodata.height,
                weight: biodata.weight,
                religion: biodata.religion,
                marital_status: biodata.marital_status,
                zilla: biodata.zilla,
                division: biodata.division,
                highlights: biodata.extra_fields.slice(0, 3),
            },
        });
    }
    catch (error) {
        console.error("[getPhotocardData] Error:", error.message);
        return res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to get photocard data",
            error: error.message,
        });
    }
}));
/**
 * Download photocard as SVG file
 */
const downloadPhotocardSVG = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { biodataId } = req.params;
    // Find the biodata - first try by MongoDB _id, then by bio_id (numeric)
    let biodata = null;
    // Try to find by MongoDB ObjectId if it's a valid format
    if (mongoose_1.default.Types.ObjectId.isValid(biodataId)) {
        biodata = yield unverified_biodata_model_1.default.findById(biodataId);
    }
    // If not found and biodataId is numeric, try to find by bio_id
    if (!biodata && !isNaN(Number(biodataId))) {
        biodata = yield unverified_biodata_model_1.default.findOne({ bio_id: Number(biodataId) });
    }
    if (!biodata) {
        return res.status(http_status_1.default.NOT_FOUND).json({
            success: false,
            message: "Biodata not found",
        });
    }
    try {
        const svgContent = yield (0, photocardService_1.generatePhotocard)(biodata, biodata.bio_id.toString());
        // Set headers for file download
        res
            .status(http_status_1.default.OK)
            .set("Content-Type", "image/svg+xml")
            .set("Content-Disposition", `attachment; filename="biodata-${biodata.bio_id}-photocard.svg"`)
            .send(svgContent);
    }
    catch (error) {
        console.error("[downloadPhotocardSVG] Error:", error.message);
        return res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to download photocard",
            error: error.message,
        });
    }
}));
/**
 * Download photocard as PNG file
 */
const downloadPhotocardPNG = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { biodataId } = req.params;
    // Find the biodata - first try by MongoDB _id, then by bio_id (numeric)
    let biodata = null;
    // Try to find by MongoDB ObjectId if it's a valid format
    if (mongoose_1.default.Types.ObjectId.isValid(biodataId)) {
        biodata = yield unverified_biodata_model_1.default.findById(biodataId);
    }
    // If not found and biodataId is numeric, try to find by bio_id
    if (!biodata && !isNaN(Number(biodataId))) {
        biodata = yield unverified_biodata_model_1.default.findOne({ bio_id: Number(biodataId) });
    }
    if (!biodata) {
        return res.status(http_status_1.default.NOT_FOUND).json({
            success: false,
            message: "Biodata not found",
        });
    }
    /**
     * Download photocard as PNG file
     * Note: Currently returns SVG as fallback due to font rendering limitations
     */
    const downloadPhotocardPNG = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { biodataId } = req.params;
        // Find the biodata - first try by MongoDB _id, then by bio_id (numeric)
        let biodata = null;
        // Try to find by MongoDB ObjectId if it's a valid format
        if (mongoose_1.default.Types.ObjectId.isValid(biodataId)) {
            biodata = yield unverified_biodata_model_1.default.findById(biodataId);
        }
        // If not found and biodataId is numeric, try to find by bio_id
        if (!biodata && !isNaN(Number(biodataId))) {
            biodata = yield unverified_biodata_model_1.default.findOne({ bio_id: Number(biodataId) });
        }
        if (!biodata) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "Biodata not found",
            });
        }
        try {
            const svgContent = yield (0, photocardService_1.generatePhotocard)(biodata, biodata.bio_id.toString());
            // Return SVG with PNG MIME type and filename for browser compatibility
            res
                .status(http_status_1.default.OK)
                .set("Content-Type", "image/svg+xml")
                .set("Content-Disposition", `attachment; filename="biodata-${biodata.bio_id}-photocard.png.svg"`)
                .send(svgContent);
        }
        catch (error) {
            console.error("[downloadPhotocardPNG] Error:", error.message);
            return res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Failed to download photocard",
                error: error.message,
            });
        }
    }));
}));
/**
 * Download photocard as SVG file (legacy - alias)
 */
const downloadPhotocard = downloadPhotocardSVG;
exports.photocardController = {
    generatePhotocardForBiodata,
    getPhotocardData,
    downloadPhotocard,
    downloadPhotocardSVG,
    downloadPhotocardPNG,
};
