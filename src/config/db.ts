import mysql, { ConnectionOptions } from "mysql2";

const access: ConnectionOptions = {
	user: "root",
	password: "",
	database: "pnc_matrimony",
	multipleStatements: true,
};

const db = mysql.createConnection(access);

export default db;
