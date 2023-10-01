import express from "express";
import { MaritalInfoController } from "./marital_info.controller";
import { auth } from "../../middlewares/auth";
const MaritalInfoRouter = express.Router();

MaritalInfoRouter.route("/")
	.get(MaritalInfoController.getMaritalInfo)
	.post(auth("user", "admin"), MaritalInfoController.createMaritalInfo)
	.put(auth("user", "admin"), MaritalInfoController.updateMaritalInfo);

MaritalInfoRouter.route("/:id/user-id").get(
	MaritalInfoController.getMaritalInfoByUserId
);
MaritalInfoRouter.route("/:id")
	.get(MaritalInfoController.getSingleMaritalInfo)
	.delete(MaritalInfoController.deleteMaritalInfo);

export default MaritalInfoRouter;
