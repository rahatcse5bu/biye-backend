"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../config"));
const tokenHeaders = () => {
    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        username: config_1.default.bkash_username,
        password: config_1.default.bkash_password,
    };
};
exports.default = tokenHeaders;
