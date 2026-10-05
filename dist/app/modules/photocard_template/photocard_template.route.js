"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhotocardTemplateRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const photocard_template_controller_1 = require("./photocard_template.controller");
const router = (0, express_1.Router)();
// TODO: templates hold raw SVG and are managed only from the admin panel.
router.use((0, auth_1.auth)("admin"));
// Get all templates
router.get("/", photocard_template_controller_1.getAllTemplates);
// Get templates by bio type
router.get("/type/:bioType", photocard_template_controller_1.getTemplatesByBioType);
// Test placeholders extraction
router.post("/test-placeholders", photocard_template_controller_1.testPlaceholders);
// Get template by ID
router.get("/:templateId", photocard_template_controller_1.getTemplateById);
// Create or update template
router.post("/", photocard_template_controller_1.createOrUpdateTemplate);
// Update template
router.put("/:templateId", photocard_template_controller_1.updateTemplate);
// Disable template
router.patch("/:templateId/disable", photocard_template_controller_1.disableTemplateController);
// Delete template
router.delete("/:templateId", photocard_template_controller_1.deleteTemplate);
exports.PhotocardTemplateRoutes = router;
