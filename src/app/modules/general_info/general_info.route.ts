import express from "express";
import { GeneralInfoController } from "./general_info.controller";
import { auth } from "../../middlewares/auth";
const GeneralInfoRouter = express.Router();

GeneralInfoRouter.route("/")
	.get(GeneralInfoController.getGeneralInfo)
	.post(auth("user", "admin"), GeneralInfoController.createGeneralInfo)
	.put(auth("user", "admin"), GeneralInfoController.updateGeneralInfo);

GeneralInfoRouter.route("/:id/user-id").get(
	GeneralInfoController.getGeneralInfoByUserId
);

GeneralInfoRouter.route("/:id")
	.get(GeneralInfoController.getSingleGeneralInfo)
	.delete(auth("user", "admin"), GeneralInfoController.deleteGeneralInfo);

export default GeneralInfoRouter;
