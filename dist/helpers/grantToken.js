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
const isomorphic_fetch_1 = __importDefault(require("isomorphic-fetch"));
const tokenParameters_1 = __importDefault(require("./tokenParameters"));
const globalDataSet_1 = __importDefault(require("./globalDataSet"));
const tokenHeaders_1 = __importDefault(require("./tokenHeaders"));
const node_global_storage_1 = require("node-global-storage");
const grantToken = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("grant token start !!");
        const tokenResponse = yield (0, isomorphic_fetch_1.default)(`${(0, node_global_storage_1.get)("bkash_base_url")}/checkout/token/grant`, {
            method: "POST",
            headers: (0, tokenHeaders_1.default)(),
            body: JSON.stringify((0, tokenParameters_1.default)()),
        });
        const tokenResult = yield tokenResponse.json();
        console.log(tokenResult);
        console.log((0, node_global_storage_1.get)("bkash_base_url"));
        (0, globalDataSet_1.default)(tokenResult);
        console.log((0, tokenHeaders_1.default)());
        return tokenResult;
    }
    catch (e) {
        console.log(e);
    }
});
exports.default = grantToken;
