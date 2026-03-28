"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const unverified_biodata_controller_1 = require("./unverified_biodata.controller");
const auth_1 = require("../../middlewares/auth");
const UnverifiedBiodataRouter = express_1.default.Router();
// Public: list active unverified biodatas (contact info excluded)
UnverifiedBiodataRouter.get("/", unverified_biodata_controller_1.UnverifiedBiodataController.getAllUnverifiedBiodatas);
// Admin: list all (including inactive, with contact info)
UnverifiedBiodataRouter.get("/admin/all", (0, auth_1.auth)("admin"), unverified_biodata_controller_1.UnverifiedBiodataController.getAllUnverifiedBiodatasByAdmin);
// Admin: parse custom fields with LLM (must be before /:id route)
UnverifiedBiodataRouter.post("/admin/parse-fields", (0, auth_1.auth)("admin"), unverified_biodata_controller_1.UnverifiedBiodataController.parseCustomFieldsWithLLM);
// User: purchase contact info (must be before /:id route)
UnverifiedBiodataRouter.post("/:id/purchase-contact", (0, auth_1.auth)("user", "admin"), unverified_biodata_controller_1.UnverifiedBiodataController.purchaseUnverifiedBiodataContact);
// Public: get single by id (contact info excluded)
UnverifiedBiodataRouter.get("/:id", unverified_biodata_controller_1.UnverifiedBiodataController.getUnverifiedBiodataById);
// Admin: create
UnverifiedBiodataRouter.post("/", (0, auth_1.auth)("admin"), unverified_biodata_controller_1.UnverifiedBiodataController.createUnverifiedBiodata);
// Admin: update
UnverifiedBiodataRouter.put("/:id", (0, auth_1.auth)("admin"), unverified_biodata_controller_1.UnverifiedBiodataController.updateUnverifiedBiodata);
// Admin: delete
UnverifiedBiodataRouter.delete("/:id", (0, auth_1.auth)("admin"), unverified_biodata_controller_1.UnverifiedBiodataController.deleteUnverifiedBiodata);
exports.default = UnverifiedBiodataRouter;
