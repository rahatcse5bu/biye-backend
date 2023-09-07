import { RowDataPacket } from "mysql2";
import app from "./app";
import db from "./config/db";

// console.log(db);

const sql = `select * from user_info`;

// db.query(sql, (_err, rows) => {
// 	console.log(rows);
// 	console.log(_err?.message);
// });

app.listen(3000, () => {
  console.log("Server is running");
});
