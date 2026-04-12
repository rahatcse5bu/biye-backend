import { Request, Response, NextFunction } from "express";
import {
    getActiveTemplatesByBioType,
    getAllActiveTemplates,
    upsertTemplate,
    disableTemplate,
    extractPlaceholders,
} from "./photocard_template.service";
import { PhotocardTemplate } from "./photocard_template.model";

/**
 * Get all active templates
 */
export const getAllTemplates = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const templates = await getAllActiveTemplates();
        res.status(200).json({
            success: true,
            data: templates,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get templates for a specific bio type
 */
export const getTemplatesByBioType = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { bioType } = req.params;

        if (!["supply", "demand"].includes(bioType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid bioType. Must be 'supply' or 'demand'",
            });
        }

        const templates = await getActiveTemplatesByBioType(
            bioType as "supply" | "demand"
        );

        res.status(200).json({
            success: true,
            bioType,
            count: templates.length,
            data: templates,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create or update a template
 */
export const createOrUpdateTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
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

        const template = await upsertTemplate({
            name,
            bioType,
            svgCode,
            description,
            isBuiltIn: isBuiltIn || false,
            createdBy: req.user?.id || "admin",
        });

        res.status(201).json({
            success: true,
            message: "Template saved successfully",
            data: template,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a single template by ID
 */
export const getTemplateById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { templateId } = req.params;
        const template = await PhotocardTemplate.findById(templateId);

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
    } catch (error) {
        next(error);
    }
};

/**
 * Update template code and details
 */
export const updateTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { templateId } = req.params;
        const { name, svgCode, description, bioType, isActive } = req.body;

        const template = await PhotocardTemplate.findByIdAndUpdate(
            templateId,
            {
                $set: {
                    name,
                    svgCode,
                    description,
                    bioType,
                    isActive,
                    placeholders: extractPlaceholders(svgCode),
                    updatedAt: new Date(),
                },
            },
            { new: true }
        );

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
    } catch (error) {
        next(error);
    }
};

/**
 * Delete template
 */
export const deleteTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { templateId } = req.params;

        const template = await PhotocardTemplate.findByIdAndDelete(templateId);

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
    } catch (error) {
        next(error);
    }
};

/**
 * Disable a template
 */
export const disableTemplateController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { templateId } = req.params;

        const template = await disableTemplate(templateId);

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
    } catch (error) {
        next(error);
    }
};

/**
 * Extract placeholders from SVG code
 */
export const testPlaceholders = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { svgCode } = req.body;

        if (!svgCode) {
            return res.status(400).json({
                success: false,
                message: "svgCode is required",
            });
        }

        const placeholders = extractPlaceholders(svgCode);

        res.status(200).json({
            success: true,
            placeholders,
            count: placeholders.length,
        });
    } catch (error) {
        next(error);
    }
};
