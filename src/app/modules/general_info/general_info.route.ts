import express from "express";
import { GeneralInfoController } from "./general_info.controller";
const GeneralInfoRouter = express.Router();

GeneralInfoRouter.route("/")
  .get(GeneralInfoController.getGeneralInfo)
  .post(GeneralInfoController.createGeneralInfo);

GeneralInfoRouter.route("/:id")
  .get(GeneralInfoController.getSingleGeneralInfo)
  .put(GeneralInfoController.updateGeneralInfo)
  .delete(GeneralInfoController.deleteGeneralInfo);

export default GeneralInfoRouter;
