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
exports.verifyIdToken = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const path_1 = __importDefault(require("path"));
// Path to your service account key file
const serviceAccount = path_1.default.resolve(__dirname, "../../../config/serviceAccountKey.json");
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount),
});
const verifyIdToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
        return res.status(401).send({
            success: false,
            message: "Unauthorized",
        });
    }
    const token = authorizationHeader.split(" ")[1];
    console.log("token~~", token);
    try {
        const decodedToken = yield firebase_admin_1.default.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    }
    catch (error) {
        res.status(401).send({
            success: false,
            message: "Unauthorized",
            error: error,
        });
        // throw new ApiError(401, "Unauthorized");
    }
});
exports.verifyIdToken = verifyIdToken;
