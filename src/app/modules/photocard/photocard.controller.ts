import { Request, Response } from "express";
import mongoose from "mongoose";
import sharp from "sharp";
import catchAsync from "../../../shared/catchAsync";
import UnverifiedBiodata from "../unverified_biodata/unverified_biodata.model";
import { generatePhotocard, generatePhotocardWithTemplate } from "../../../services/photocardService";
import { PhotocardTemplate } from "../photocard_template/photocard_template.model";
import httpStatus from "http-status";

/**
 * Generate a promotional photocard for an unverified biodata
 * Supports optional template parameter to use custom SVG templates
 * Returns SVG data that can be rendered or downloaded
 */
const generatePhotocardForBiodata = catchAsync(
    async (req: Request, res: Response) => {
        const { biodataId } = req.params;
        const { templateId } = req.query;

        // Find the biodata - first try by MongoDB _id, then by bio_id (numeric)
        let biodata = null;

        // Try to find by MongoDB ObjectId if it's a valid format
        if (mongoose.Types.ObjectId.isValid(biodataId)) {
            biodata = await UnverifiedBiodata.findById(biodataId);
        }

        // If not found and biodataId is numeric, try to find by bio_id
        if (!biodata && !isNaN(Number(biodataId))) {
            biodata = await UnverifiedBiodata.findOne({ bio_id: Number(biodataId) });
        }

        if (!biodata) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: "Biodata not found",
            });
        }

        try {
            let template = null;

            // Get template if specified
            if (templateId) {
                template = await PhotocardTemplate.findById(templateId);
            } else {
                // Try to get default template for bio_type
                const bioType = biodata.bio_type?.toLowerCase().includes("চাই") ? "demand" : "supply";
                template = await PhotocardTemplate.findOne({
                    bioType,
                    isActive: true,
                }).sort({ updatedAt: -1 });
            }

            // Generate the photocard SVG
            let svgContent: string;
            if (template) {
                svgContent = await generatePhotocardWithTemplate(biodata, biodata.bio_id.toString(), template);
            } else {
                svgContent = await generatePhotocard(biodata, biodata.bio_id.toString());
            }

            // Send as SVG
            res.status(httpStatus.OK).set("Content-Type", "image/svg+xml").send(svgContent);
        } catch (error: any) {
            console.error("[generatePhotocardForBiodata] Error:", error.message);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Failed to generate photocard",
                error: error.message,
            });
        }
    }
);

/**
 * Get photocard as JSON data (for preview or manipulation before generation)
 */
const getPhotocardData = catchAsync(async (req: Request, res: Response) => {
    const { biodataId } = req.params;

    // Find the biodata - first try by MongoDB _id, then by bio_id (numeric)
    let biodata = null;

    // Try to find by MongoDB ObjectId if it's a valid format
    if (mongoose.Types.ObjectId.isValid(biodataId)) {
        biodata = await UnverifiedBiodata.findById(biodataId);
    }

    // If not found and biodataId is numeric, try to find by bio_id
    if (!biodata && !isNaN(Number(biodataId))) {
        biodata = await UnverifiedBiodata.findOne({ bio_id: Number(biodataId) });
    }

    if (!biodata) {
        return res.status(httpStatus.NOT_FOUND).json({
            success: false,
            message: "Biodata not found",
        });
    }

    try {
        // For now, just return biodata info
        // LLM extraction happens during SVG generation
        res.status(httpStatus.OK).json({
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
    } catch (error: any) {
        console.error("[getPhotocardData] Error:", error.message);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to get photocard data",
            error: error.message,
        });
    }
});

/**
 * Download photocard as SVG file
 */
const downloadPhotocardSVG = catchAsync(async (req: Request, res: Response) => {
    const { biodataId } = req.params;

    // Find the biodata - first try by MongoDB _id, then by bio_id (numeric)
    let biodata = null;

    // Try to find by MongoDB ObjectId if it's a valid format
    if (mongoose.Types.ObjectId.isValid(biodataId)) {
        biodata = await UnverifiedBiodata.findById(biodataId);
    }

    // If not found and biodataId is numeric, try to find by bio_id
    if (!biodata && !isNaN(Number(biodataId))) {
        biodata = await UnverifiedBiodata.findOne({ bio_id: Number(biodataId) });
    }

    if (!biodata) {
        return res.status(httpStatus.NOT_FOUND).json({
            success: false,
            message: "Biodata not found",
        });
    }

    try {
        const svgContent = await generatePhotocard(biodata, biodata.bio_id.toString());

        // Set headers for file download
        res
            .status(httpStatus.OK)
            .set("Content-Type", "image/svg+xml")
            .set(
                "Content-Disposition",
                `attachment; filename="biodata-${biodata.bio_id}-photocard.svg"`
            )
            .send(svgContent);
    } catch (error: any) {
        console.error("[downloadPhotocardSVG] Error:", error.message);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to download photocard",
            error: error.message,
        });
    }
});

/**
 * Download photocard as PNG file
 */
const downloadPhotocardPNG = catchAsync(async (req: Request, res: Response) => {
    const { biodataId } = req.params;

    // Find the biodata - first try by MongoDB _id, then by bio_id (numeric)
    let biodata = null;

    // Try to find by MongoDB ObjectId if it's a valid format
    if (mongoose.Types.ObjectId.isValid(biodataId)) {
        biodata = await UnverifiedBiodata.findById(biodataId);
    }

    // If not found and biodataId is numeric, try to find by bio_id
    if (!biodata && !isNaN(Number(biodataId))) {
        biodata = await UnverifiedBiodata.findOne({ bio_id: Number(biodataId) });
    }

    if (!biodata) {
        return res.status(httpStatus.NOT_FOUND).json({
            success: false,
            message: "Biodata not found",
        });
    }

    /**
     * Download photocard as PNG file
     * Note: Currently returns SVG as fallback due to font rendering limitations
     */
    const downloadPhotocardPNG = catchAsync(async (req: Request, res: Response) => {
        const { biodataId } = req.params;

        // Find the biodata - first try by MongoDB _id, then by bio_id (numeric)
        let biodata = null;

        // Try to find by MongoDB ObjectId if it's a valid format
        if (mongoose.Types.ObjectId.isValid(biodataId)) {
            biodata = await UnverifiedBiodata.findById(biodataId);
        }

        // If not found and biodataId is numeric, try to find by bio_id
        if (!biodata && !isNaN(Number(biodataId))) {
            biodata = await UnverifiedBiodata.findOne({ bio_id: Number(biodataId) });
        }

        if (!biodata) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: "Biodata not found",
            });
        }

        try {
            const svgContent = await generatePhotocard(biodata, biodata.bio_id.toString());

            // Return SVG with PNG MIME type and filename for browser compatibility
            res
                .status(httpStatus.OK)
                .set("Content-Type", "image/svg+xml")
                .set(
                    "Content-Disposition",
                    `attachment; filename="biodata-${biodata.bio_id}-photocard.png.svg"`
                )
                .send(svgContent);
        } catch (error: any) {
            console.error("[downloadPhotocardPNG] Error:", error.message);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Failed to download photocard",
                error: error.message,
            });
        }
    });
});

/**
 * Download photocard as SVG file (legacy - alias)
 */
const downloadPhotocard = downloadPhotocardSVG;

export const photocardController = {
    generatePhotocardForBiodata,
    getPhotocardData,
    downloadPhotocard,
    downloadPhotocardSVG,
    downloadPhotocardPNG,
};
