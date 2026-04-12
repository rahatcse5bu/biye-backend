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
exports.testPlaceholders = exports.disableTemplateController = exports.deleteTemplate = exports.updateTemplate = exports.getTemplateById = exports.createOrUpdateTemplate = exports.getTemplatesByBioType = exports.getAllTemplates = void 0;
const photocard_template_service_1 = require("./photocard_template.service");
const photocard_template_model_1 = require("./photocard_template.model");
/**
 * Get all active templates
 */
const getAllTemplates = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const templates = yield (0, photocard_template_service_1.getAllActiveTemplates)();
        res.status(200).json({
            success: true,
            data: templates,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllTemplates = getAllTemplates;
/**
 * Get templates for a specific bio type
 */
const getTemplatesByBioType = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { bioType } = req.params;
        if (!["supply", "demand"].includes(bioType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid bioType. Must be 'supply' or 'demand'",
            });
        }
        const templates = yield (0, photocard_template_service_1.getActiveTemplatesByBioType)(bioType);
        res.status(200).json({
            success: true,
            bioType,
            count: templates.length,
            data: templates,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getTemplatesByBioType = getTemplatesByBioType;
/**
 * Create or update a template
 */
const createOrUpdateTemplate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, bioType, svgCode, description, isBuiltIn } = req.body;
        // Validation
        if (!name || !bioType || !svgCode) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: name, bioType, svgCode",
            });
        }
        if (!["supply", "demand"].includes(bioType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid bioType. Must be 'supply' or 'demand'",
            });
        }
        const template = yield (0, photocard_template_service_1.upsertTemplate)({
            name,
            bioType,
            svgCode,
            description,
            isBuiltIn: isBuiltIn || false,
            createdBy: ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || "admin",
        });
        res.status(201).json({
            success: true,
            message: "Template saved successfully",
            data: template,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createOrUpdateTemplate = createOrUpdateTemplate;
/**
 * Get a single template by ID
 */
const getTemplateById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { templateId } = req.params;
        const template = yield photocard_template_model_1.PhotocardTemplate.findById(templateId);
        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Template not found",
            });
        }
        res.status(200).json({
            success: true,
            data: template,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getTemplateById = getTemplateById;
/**
 * Update template code and details
 */
const updateTemplate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { templateId } = req.params;
        const { name, svgCode, description, bioType, isActive } = req.body;
        const template = yield photocard_template_model_1.PhotocardTemplate.findByIdAndUpdate(templateId, {
            $set: {
                name,
                svgCode,
                description,
                bioType,
                isActive,
                placeholders: (0, photocard_template_service_1.extractPlaceholders)(svgCode),
                updatedAt: new Date(),
            },
        }, { new: true });
        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Template not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Template updated",
            data: template,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateTemplate = updateTemplate;
/**
 * Delete template
 */
const deleteTemplate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { templateId } = req.params;
        const template = yield photocard_template_model_1.PhotocardTemplate.findByIdAndDelete(templateId);
        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Template not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Template deleted",
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteTemplate = deleteTemplate;
/**
 * Disable a template
 */
const disableTemplateController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { templateId } = req.params;
        const template = yield (0, photocard_template_service_1.disableTemplate)(templateId);
        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Template not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Template disabled",
            data: template,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.disableTemplateController = disableTemplateController;
/**
 * Extract placeholders from SVG code
 */
const testPlaceholders = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { svgCode } = req.body;
        if (!svgCode) {
            return res.status(400).json({
                success: false,
                message: "svgCode is required",
            });
        }
        const placeholders = (0, photocard_template_service_1.extractPlaceholders)(svgCode);
        res.status(200).json({
            success: true,
            placeholders,
            count: placeholders.length,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.testPlaceholders = testPlaceholders;
