import mysql, { ConnectionOptions } from "mysql2";

const access: ConnectionOptions = {
	user: "root",
	password: "",
	database: "pncmatrimony",
	multipleStatements: true,
};

const db = mysql.createConnection(access);

export default db;
