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
exports.connectMongo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
require("colors");
const index_1 = __importDefault(require("./index"));
const SERVER_SELECTION_TIMEOUT_MS = 10000;
let connectionPromise = null;
mongoose_1.default.connection.on("disconnected", () => {
    connectionPromise = null;
    console.error("MongoDB connection lost; waiting to reconnect");
});
mongoose_1.default.connection.on("reconnected", () => {
    console.log("MongoDB connection re-established".green.underline);
});
mongoose_1.default.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error);
});
function connectMongo() {
    return __awaiter(this, void 0, void 0, function* () {
        if (mongoose_1.default.connection.readyState === mongoose_1.default.ConnectionStates.connected) {
            return mongoose_1.default;
        }
        if (!index_1.default.mongo_url) {
            throw new Error(`MongoDB URL is not configured for NODE_ENV=${index_1.default.node_env || "undefined"}`);
        }
        if (!connectionPromise) {
            connectionPromise = mongoose_1.default
                .connect(index_1.default.mongo_url, {
                serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
            })
                .catch((error) => {
                connectionPromise = null;
                throw error;
            });
        }
        return connectionPromise;
    });
}
exports.connectMongo = connectMongo;
