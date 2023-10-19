"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({
    path: path_1.default.join(process.cwd(), ".env"),
});
exports.default = {
    port: process.env.PORT,
    jwt_secret: process.env.JWT_SECRET,
    sand_box: process.env.SANDBOX,
    bkash_app_secret: process.env.BKASH_APP_SECRET,
    bkash_app_key: process.env.BKASH_APP_KEY,
    bkash_username: process.env.BKASH_USER_NAME,
    bkash_password: process.env.BKASH_PASSWORD,
};
