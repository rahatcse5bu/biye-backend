import express from "express";
import { PersonalInfoController } from "./personal_info.controller"; // Replace with the actual path
import { auth } from "../../middlewares/auth";

const personalInfoRouter = express.Router();

personalInfoRouter
	.route("/")
	.get(PersonalInfoController.getPersonalInfo)
	.post(auth("user", "admin"), PersonalInfoController.createPersonalInfo)
	.put(auth("user", "admin"), PersonalInfoController.updatePersonalInfo);

personalInfoRouter
	.route("/:id/user-id")
	.get(PersonalInfoController.getPersonalInfoByUserId);
personalInfoRouter
	.route("/:id")
	.get(PersonalInfoController.getSinglePersonalInfo)
	.delete(PersonalInfoController.deletePersonalInfo);

export default personalInfoRouter;
