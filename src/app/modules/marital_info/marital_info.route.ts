import express from "express";
import { MaritalInfoController } from "./marital_info.controller";
import { auth } from "../../middlewares/auth";
const MaritalInfoRouter = express.Router();

MaritalInfoRouter.route("/")
  .get(auth("admin"), MaritalInfoController.getAllMaritalInfos)
  .post(auth("user", "admin"), MaritalInfoController.createMaritalInfo)
  .put(auth("user", "admin"), MaritalInfoController.updateMaritalInfo);

MaritalInfoRouter.route("/token").get(
  auth("user", "admin"),
  MaritalInfoController.getMaritalInfoByToken
);
MaritalInfoRouter.route("/:id")
  .get(auth("user", "admin"), MaritalInfoController.getMaritalInfoById)
  .delete(auth("user", "admin"), MaritalInfoController.deleteMaritalInfo);

export default MaritalInfoRouter;
