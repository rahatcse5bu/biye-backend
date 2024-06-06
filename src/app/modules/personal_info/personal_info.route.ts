import express from "express";
import { auth } from "../../middlewares/auth";
import { PersonalInfoController } from "./personal_info.controller";

const personalInfoRouter = express.Router();

personalInfoRouter
  .route("/")
  .get(PersonalInfoController.getAllPersonalInfoes)
  .post(auth("user", "admin"), PersonalInfoController.createPersonalInfo)
  .put(auth("user", "admin"), PersonalInfoController.updatePersonalInfo);

personalInfoRouter
  .route("/token")
  .get(auth("user", "admin"), PersonalInfoController.getPersonalInfoByToken);
personalInfoRouter
  .route("/:id")
  .get(PersonalInfoController.getPersonalInfoById)
  .delete(PersonalInfoController.deletePersonalInfo);

export default personalInfoRouter;
