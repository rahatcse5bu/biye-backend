"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mysql2_1 = __importDefault(require("mysql2"));
const access = {
    user: "root",
    password: "",
    database: "pnc_matrimony",
    multipleStatements: true,
};
const db = mysql2_1.default.createConnection(access);
exports.default = db;
