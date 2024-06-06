"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ongikar_nama_controller_1 = require("./ongikar_nama.controller");
const auth_1 = require("../../middlewares/auth");
const ongikarNamaRouter = express_1.default.Router();
ongikarNamaRouter
    .route("/")
    .get((0, auth_1.auth)("admin"), ongikar_nama_controller_1.OngikarNamaController.getAllOngikarNamaes)
    .post((0, auth_1.auth)("user", "admin"), ongikar_nama_controller_1.OngikarNamaController.createOngikarNama)
    .put((0, auth_1.auth)("user", "admin"), ongikar_nama_controller_1.OngikarNamaController.updateOngikarNama);
ongikarNamaRouter
    .route("/token")
    .get((0, auth_1.auth)("user", "admin"), ongikar_nama_controller_1.OngikarNamaController.getOngikarNamaByToken);
ongikarNamaRouter
    .route("/:id")
    .get((0, auth_1.auth)("admin"), ongikar_nama_controller_1.OngikarNamaController.getOngikarNamaById)
    .delete((0, auth_1.auth)("admin"), ongikar_nama_controller_1.OngikarNamaController.deleteOngikarNama);
exports.default = ongikarNamaRouter;
