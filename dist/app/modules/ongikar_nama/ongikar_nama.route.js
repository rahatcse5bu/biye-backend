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
    .get(ongikar_nama_controller_1.OngikarNamaController.getOngikarNama)
    .post((0, auth_1.auth)("user", "admin"), ongikar_nama_controller_1.OngikarNamaController.createOngikarNama)
    .put((0, auth_1.auth)("user", "admin"), ongikar_nama_controller_1.OngikarNamaController.updateOngikarNama);
ongikarNamaRouter
    .route("/:id/user-id")
    .get(ongikar_nama_controller_1.OngikarNamaController.getOngikarNamaByUserId);
ongikarNamaRouter
    .route("/:id")
    .get(ongikar_nama_controller_1.OngikarNamaController.getSingleOngikarNama)
    .delete(ongikar_nama_controller_1.OngikarNamaController.deleteOngikarNama);
exports.default = ongikarNamaRouter;
