import { PhotocardTemplate } from "../photocard_template/photocard_template.model";
import { BioType } from "../photocard_template/photocard_template.interface";

/**
 * Get the most recent active template for a given bio type
 */
export const getTemplateForBioType = async (bioType: BioType) => {
    const template = await PhotocardTemplate.findOne({
        bioType,
        isActive: true,
    }).sort({ updatedAt: -1 });

    if (!template) {
        throw new Error(`No active template found for bio type: ${bioType}`);
    }

    return template;
};

/**
 * Replace placeholders in SVG with actual data
 * Example: {name} → "রহিম", {age} → "25"
 */
export const renderTemplateSVG = (
    svgCode: string,
    data: Record<string, any>
): string => {
    let rendered = svgCode;

    // Replace all placeholders with data values
    for (const [key, value] of Object.entries(data)) {
        if (value === undefined || value === null) continue;

        // Match placeholders like {key}, {key:format}, etc
        const regex = new RegExp(`\\{${key}(?::[^}]*)?\\}`, "g");
        rendered = rendered.replace(regex, String(value));
    }

    // Remove any unreplaced placeholders
    rendered = rendered.replace(/\{[^}]+\}/g, "");

    return rendered;
};

/**
 * Extract placeholders from SVG template
 * Returns array like ["name", "age", "location", ...]
 */
export const extractPlaceholders = (svgCode: string): string[] => {
    const matches = svgCode.match(/\{(\w+)(?::[^}]*)?\}/g) || [];
    return [...new Set(matches.map((m) => m.slice(1, -1).split(":")[0]))];
};

/**
 * Create or update a template
 */
export const upsertTemplate = async (templateData: any) => {
    const { name, bioType, svgCode, isBuiltIn, description } = templateData;

    // Extract placeholders automatically
    const placeholders = extractPlaceholders(svgCode);

    const template = await PhotocardTemplate.findOneAndUpdate(
        { name, bioType },
        {
            name,
            bioType,
            svgCode,
            isBuiltIn,
            description,
            placeholders,
            createdBy: templateData.createdBy || "system",
        },
        { upsert: true, new: true }
    );

    return template;
};

/**
 * Get all active templates
 */
export const getAllActiveTemplates = async () => {
    return PhotocardTemplate.find({ isActive: true }).sort({ bioType: 1 });
};

/**
 * Get templates by bio type
 */
export const getActiveTemplatesByBioType = async (bioType: BioType) => {
    return PhotocardTemplate.find({ bioType, isActive: true }).sort({
        updatedAt: -1,
    });
};

/**
 * Disable a template
 */
export const disableTemplate = async (templateId: string) => {
    return PhotocardTemplate.findByIdAndUpdate(
        templateId,
        { isActive: false },
        { new: true }
    );
};
