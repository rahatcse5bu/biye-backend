import express from "express";
import { OngikarNamaController } from "./ongikar_nama.controller";
import { auth } from "../../middlewares/auth";
const ongikarNamaRouter = express.Router();

ongikarNamaRouter
  .route("/")
  .get(auth("admin"), OngikarNamaController.getAllOngikarNamaes)
  .post(auth("user", "admin"), OngikarNamaController.createOngikarNama)
  .put(auth("user", "admin"), OngikarNamaController.updateOngikarNama);

ongikarNamaRouter
  .route("/token")
  .get(auth("user", "admin"), OngikarNamaController.getOngikarNamaByToken);
ongikarNamaRouter
  .route("/:id")
  .get(auth("admin"), OngikarNamaController.getOngikarNamaById)
  .delete(auth("admin"), OngikarNamaController.deleteOngikarNama);

export default ongikarNamaRouter;
