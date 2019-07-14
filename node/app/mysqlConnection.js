const mysql = require('mysql');

const dbConfig = {
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	user: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE
};

const connection = mysql.createConnection(dbConfig);

module.exports = connection;