import express from "express";
import { BioDataController } from "./bio_data.controller";

const BioDataRouter = express.Router();

BioDataRouter.route("/:id").get(BioDataController.getBioData);
export default BioDataRouter;
