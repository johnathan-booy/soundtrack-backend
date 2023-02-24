"use strict";

/** Database setup for SoundTrack Academy */

const { Client } = require("pg");
const { getDatabaseUri } = require("./config");

const db = new Client({
	connectionString: getDatabaseUri(),
	ssl: process.env.NODE_ENV === "production" && {
		rejectUnauthorized: false,
	},
});

db.connect();

module.exports = db;
