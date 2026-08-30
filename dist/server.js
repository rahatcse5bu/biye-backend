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
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
let server;
let isShuttingDown = false;
const shutdown = (exitCode, error) => __awaiter(void 0, void 0, void 0, function* () {
    if (isShuttingDown)
        return;
    isShuttingDown = true;
    if (error)
        console.error(error);
    if (server) {
        const activeServer = server;
        yield new Promise((resolve) => activeServer.close(() => resolve()));
    }
    yield mongoose_1.default.disconnect();
    process.exit(exitCode);
});
process.on("SIGINT", () => void shutdown(0));
process.on("SIGTERM", () => void shutdown(0));
process.on("unhandledRejection", (error) => {
    console.error("Unhandled rejection; shutting down the server");
    void shutdown(1, error);
});
process.on("uncaughtException", (error) => {
    console.error("Uncaught exception; shutting down the server");
    void shutdown(1, error);
});
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        server = yield (0, db_1.connectDb)(app_1.default);
    }
    catch (error) {
        console.error("Failed to start the server");
        yield shutdown(1, error);
    }
});
void startServer();
