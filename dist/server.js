"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
// console.log(db);
const sql = `select * from user_info`;
// db.query(sql, (_err, rows) => {
// 	console.log(rows);
// 	console.log(_err?.message);
// });
app_1.default.listen(config_1.default.port, () => {
    console.log("Server is running");
});
