import express from "express";
import { BioDataController } from "./bio_data.controller";
import { auth } from "../../middlewares/auth";

const BioDataRouter = express.Router();

BioDataRouter.route("/stats").get(BioDataController.getBioDataStat);
BioDataRouter.route("/:id").get(BioDataController.getBioData);
BioDataRouter.route("/admin/:id").get(
  auth("admin"),
  BioDataController.getBioDataByAdmin
);
export default BioDataRouter;
