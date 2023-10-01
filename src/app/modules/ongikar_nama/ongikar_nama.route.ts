import express from "express";
import { OngikarNamaController } from "./ongikar_nama.controller";
import { auth } from "../../middlewares/auth";
const ongikarNamaRouter = express.Router();

ongikarNamaRouter
	.route("/")
	.get(OngikarNamaController.getOngikarNama)
	.post(auth("user", "admin"), OngikarNamaController.createOngikarNama)
	.put(auth("user", "admin"), OngikarNamaController.updateOngikarNama);

ongikarNamaRouter
	.route("/:id/user-id")
	.get(OngikarNamaController.getOngikarNamaByUserId);
ongikarNamaRouter
	.route("/:id")
	.get(OngikarNamaController.getSingleOngikarNama)
	.delete(OngikarNamaController.deleteOngikarNama);

export default ongikarNamaRouter;
