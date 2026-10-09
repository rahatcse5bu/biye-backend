import express from "express";
import { auth } from "../../middlewares/auth";
import { PersonalInfoController } from "./personal_info.controller";

const personalInfoRouter = express.Router();

personalInfoRouter
  .route("/")
  .get(auth("admin"), PersonalInfoController.getAllPersonalInfoes)
  .post(auth("user", "admin"), PersonalInfoController.createPersonalInfo)
  .put(auth("user", "admin"), PersonalInfoController.updatePersonalInfo);

personalInfoRouter
  .route("/token")
  .get(auth("user", "admin"), PersonalInfoController.getPersonalInfoByToken);
personalInfoRouter
  .route("/:id")
  .get(auth("admin"), PersonalInfoController.getPersonalInfoById)
  .delete(auth("admin"), PersonalInfoController.deletePersonalInfo);

export default personalInfoRouter;
