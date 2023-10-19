"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_global_storage_1 = require("node-global-storage");
const config_1 = __importDefault(require("../config"));
const authHeaders = () => __awaiter(void 0, void 0, void 0, function* () {
    // console.log("token~", globals.get("id_token"));
    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        authorization: (0, node_global_storage_1.get)("id_token"),
        "X-App-Key": config_1.default.bkash_app_key,
    };
});
exports.default = authHeaders;
