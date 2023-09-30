import express from "express";
import { MaritalInfoController } from "./marital_info.controller";
const MaritalInfoRouter = express.Router();

MaritalInfoRouter.route("/")
  .get(MaritalInfoController.getMaritalInfo)
  .post(MaritalInfoController.createMaritalInfo);

MaritalInfoRouter.route("/:id")
  .get(MaritalInfoController.getSingleMaritalInfo)
  .put(MaritalInfoController.updateMaritalInfo)
  .delete(MaritalInfoController.deleteMaritalInfo);

export default MaritalInfoRouter;
