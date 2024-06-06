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
exports.connectDb = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = __importDefault(require("http"));
require("colors");
const index_1 = __importDefault(require("./index"));
function connectDb(app) {
    return __awaiter(this, void 0, void 0, function* () {
        let server;
        try {
            yield mongoose_1.default.connect(index_1.default.mongo_url);
            console.log("connection established successfully into database".green.underline);
            server = http_1.default.createServer(app);
            server.listen(index_1.default.port, () => {
                console.log(`app listening on port=> ${index_1.default.port}`.yellow.underline);
            });
        }
        catch (err) {
            console.error(err);
        }
        process.on("unhandledRejection", (error) => {
            // eslint-disable-next-line no-console
            console.log("Unhandled Rejection is detected ,we are closing our server".red.underline);
            if (server) {
                server.close(() => {
                    console.error(error);
                    process.exit(1);
                });
            }
            else {
                console.log(error);
                process.exit(1);
            }
        });
    });
}
exports.connectDb = connectDb;
