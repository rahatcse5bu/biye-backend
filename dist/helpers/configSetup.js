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
const config_1 = __importDefault(require("../config"));
const node_global_storage_1 = require("node-global-storage");
const configSetup = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log(node_global_storage_1.get);
    const sandbox = (_a = config_1.default.sand_box) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    if ((0, node_global_storage_1.get)("sandbox") !== sandbox) {
        (0, node_global_storage_1.flush)();
        if (sandbox === "on") {
            (0, node_global_storage_1.set)("bkash_base_url", "https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized");
        }
        else {
            (0, node_global_storage_1.set)("bkash_base_url", "https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized");
        }
        (0, node_global_storage_1.set)("sandbox", sandbox);
    }
    else {
        (0, node_global_storage_1.set)("sandbox", sandbox);
    }
});
exports.default = configSetup;
