import express from "express";
import { GeneralInfoController } from "./general_info.controller";
import { auth } from "../../middlewares/auth";
const GeneralInfoRouter = express.Router();

GeneralInfoRouter.route("/")
  .get(GeneralInfoController.getGeneralInfo)
  .post(auth("user", "admin"), GeneralInfoController.createGeneralInfo)
  .put(auth("user", "admin"), GeneralInfoController.updateGeneralInfo);

GeneralInfoRouter.route("/token").get(
  auth("user", "admin"),
  GeneralInfoController.getGeneralInfoByToken
);
GeneralInfoRouter.route("/:id/user-id").get(
  GeneralInfoController.getGeneralInfoByUserId
);

GeneralInfoRouter.route("/watch/:id").get(
  GeneralInfoController.updateWatchOfBioData
);
GeneralInfoRouter.route("/:id")
  .get(auth("admin"), GeneralInfoController.getSingleGeneralInfo)
  .delete(auth("admin"), GeneralInfoController.deleteGeneralInfo);

export default GeneralInfoRouter;
