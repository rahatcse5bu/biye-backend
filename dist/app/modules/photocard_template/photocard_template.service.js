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
Object.defineProperty(exports, "__esModule", { value: true });
exports.disableTemplate = exports.getActiveTemplatesByBioType = exports.getAllActiveTemplates = exports.upsertTemplate = exports.extractPlaceholders = exports.renderTemplateSVG = exports.getTemplateForBioType = void 0;
const photocard_template_model_1 = require("../photocard_template/photocard_template.model");
/**
 * Get the most recent active template for a given bio type
 */
const getTemplateForBioType = (bioType) => __awaiter(void 0, void 0, void 0, function* () {
    const template = yield photocard_template_model_1.PhotocardTemplate.findOne({
        bioType,
        isActive: true,
    }).sort({ updatedAt: -1 });
    if (!template) {
        throw new Error(`No active template found for bio type: ${bioType}`);
    }
    return template;
});
exports.getTemplateForBioType = getTemplateForBioType;
/**
 * Replace placeholders in SVG with actual data
 * Example: {name} → "রহিম", {age} → "25"
 */
const renderTemplateSVG = (svgCode, data) => {
    let rendered = svgCode;
    // Replace all placeholders with data values
    for (const [key, value] of Object.entries(data)) {
        if (value === undefined || value === null)
            continue;
        // Match placeholders like {key}, {key:format}, etc
        const regex = new RegExp(`\\{${key}(?::[^}]*)?\\}`, "g");
        rendered = rendered.replace(regex, String(value));
    }
    // Remove any unreplaced placeholders
    rendered = rendered.replace(/\{[^}]+\}/g, "");
    return rendered;
};
exports.renderTemplateSVG = renderTemplateSVG;
/**
 * Extract placeholders from SVG template
 * Returns array like ["name", "age", "location", ...]
 */
const extractPlaceholders = (svgCode) => {
    const matches = svgCode.match(/\{(\w+)(?::[^}]*)?\}/g) || [];
    return [...new Set(matches.map((m) => m.slice(1, -1).split(":")[0]))];
};
exports.extractPlaceholders = extractPlaceholders;
/**
 * Create or update a template
 */
const upsertTemplate = (templateData) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, bioType, svgCode, isBuiltIn, description } = templateData;
    // Extract placeholders automatically
    const placeholders = (0, exports.extractPlaceholders)(svgCode);
    const template = yield photocard_template_model_1.PhotocardTemplate.findOneAndUpdate({ name, bioType }, {
        name,
        bioType,
        svgCode,
        isBuiltIn,
        description,
        placeholders,
        createdBy: templateData.createdBy || "system",
    }, { upsert: true, new: true });
    return template;
});
exports.upsertTemplate = upsertTemplate;
/**
 * Get all active templates
 */
const getAllActiveTemplates = () => __awaiter(void 0, void 0, void 0, function* () {
    return photocard_template_model_1.PhotocardTemplate.find({ isActive: true }).sort({ bioType: 1 });
});
exports.getAllActiveTemplates = getAllActiveTemplates;
/**
 * Get templates by bio type
 */
const getActiveTemplatesByBioType = (bioType) => __awaiter(void 0, void 0, void 0, function* () {
    return photocard_template_model_1.PhotocardTemplate.find({ bioType, isActive: true }).sort({
        updatedAt: -1,
    });
});
exports.getActiveTemplatesByBioType = getActiveTemplatesByBioType;
/**
 * Disable a template
 */
const disableTemplate = (templateId) => __awaiter(void 0, void 0, void 0, function* () {
    return photocard_template_model_1.PhotocardTemplate.findByIdAndUpdate(templateId, { isActive: false }, { new: true });
});
exports.disableTemplate = disableTemplate;
