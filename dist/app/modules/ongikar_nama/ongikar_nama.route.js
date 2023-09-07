"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ongikar_nama_controller_1 = require("./ongikar_nama.controller");
const ongikarNamaRouter = express_1.default.Router();
ongikarNamaRouter
    .route('/')
    .get(ongikar_nama_controller_1.OngikarNamaController.getOngikarNama)
    .post(ongikar_nama_controller_1.OngikarNamaController.createOngikarNama);
ongikarNamaRouter
    .route('/:id')
    .get(ongikar_nama_controller_1.OngikarNamaController.getSingleOngikarNama)
    .put(ongikar_nama_controller_1.OngikarNamaController.updateOngikarNama)
    .delete(ongikar_nama_controller_1.OngikarNamaController.deleteOngikarNama);
exports.default = ongikarNamaRouter;
