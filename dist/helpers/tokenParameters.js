"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../config"));
const tokenParameters = () => {
    return {
        app_key: config_1.default.bkash_app_key,
        app_secret: config_1.default.bkash_app_secret,
    };
};
exports.default = tokenParameters;
