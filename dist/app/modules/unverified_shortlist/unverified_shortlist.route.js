"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const unverified_shortlist_controller_1 = require("./unverified_shortlist.controller");
const auth_1 = require("../../middlewares/auth");
const router = express_1.default.Router();
router.post("/", (0, auth_1.auth)("user", "admin"), unverified_shortlist_controller_1.UnverifiedShortlistController.toggle);
router.get("/", (0, auth_1.auth)("user", "admin"), unverified_shortlist_controller_1.UnverifiedShortlistController.getMyShortlist);
router.get("/check/:id", (0, auth_1.auth)("user", "admin"), unverified_shortlist_controller_1.UnverifiedShortlistController.check);
exports.default = router;
