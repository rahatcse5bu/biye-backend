import { Router } from "express";
import { auth } from "../../middlewares/auth";
import {
    getAllTemplates,
    getTemplatesByBioType,
    createOrUpdateTemplate,
    getTemplateById,
    updateTemplate,
    deleteTemplate,
    disableTemplateController,
    testPlaceholders,
} from "./photocard_template.controller";

const router = Router();

// TODO: templates hold raw SVG and are managed only from the admin panel.
router.use(auth("admin"));

// Get all templates
router.get("/", getAllTemplates);

// Get templates by bio type
router.get("/type/:bioType", getTemplatesByBioType);

// Test placeholders extraction
router.post("/test-placeholders", testPlaceholders);

// Get template by ID
router.get("/:templateId", getTemplateById);

// Create or update template
router.post("/", createOrUpdateTemplate);

// Update template
router.put("/:templateId", updateTemplate);

// Disable template
router.patch("/:templateId/disable", disableTemplateController);

// Delete template
router.delete("/:templateId", deleteTemplate);

export const PhotocardTemplateRoutes = router;
