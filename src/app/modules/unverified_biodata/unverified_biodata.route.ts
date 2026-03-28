import express from "express";
import { UnverifiedBiodataController } from "./unverified_biodata.controller";
import { auth } from "../../middlewares/auth";

const UnverifiedBiodataRouter = express.Router();

// Public: list active unverified biodatas (contact info excluded)
UnverifiedBiodataRouter.get("/", UnverifiedBiodataController.getAllUnverifiedBiodatas);

// Admin: list all (including inactive, with contact info)
UnverifiedBiodataRouter.get(
  "/admin/all",
  auth("admin"),
  UnverifiedBiodataController.getAllUnverifiedBiodatasByAdmin
);

// Admin: parse custom fields with LLM (must be before /:id route)
UnverifiedBiodataRouter.post(
  "/admin/parse-fields",
  auth("admin"),
  UnverifiedBiodataController.parseCustomFieldsWithLLM
);

// User: purchase contact info (must be before /:id route)
UnverifiedBiodataRouter.post(
  "/:id/purchase-contact",
  auth("user", "admin"),
  UnverifiedBiodataController.purchaseUnverifiedBiodataContact
);

// Public: get single by id (contact info excluded)
UnverifiedBiodataRouter.get("/:id", UnverifiedBiodataController.getUnverifiedBiodataById);

// Admin: create
UnverifiedBiodataRouter.post(
  "/",
  auth("admin"),
  UnverifiedBiodataController.createUnverifiedBiodata
);

// Admin: update
UnverifiedBiodataRouter.put(
  "/:id",
  auth("admin"),
  UnverifiedBiodataController.updateUnverifiedBiodata
);

// Admin: delete
UnverifiedBiodataRouter.delete(
  "/:id",
  auth("admin"),
  UnverifiedBiodataController.deleteUnverifiedBiodata
);

export default UnverifiedBiodataRouter;
