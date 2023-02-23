"use strict";

/** Shared config file for application */

require("colors");

const SECRET_KEY = process.env.SECRET_KEY || "secret-dev";
const PORT = +process.env.PORT || 3001;

function getDatabaseUri() {
	return process.env.NODE_ENV === "test"
		? "soundtrack_test"
		: process.env.DATABASE_URL || "soundtrack";
}

// Speed up bcrypt during tests, since the algorithm safety isn't being tested
const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 13;

console.log("-------SoundTrack Config-------".black.bgWhite);
console.log("SECRET_KEY:".blue, SECRET_KEY.yellow);
console.log("PORT:".blue, PORT.toString().yellow);
console.log("BCRYPT_WORK_FACTOR".blue, BCRYPT_WORK_FACTOR);
console.log("Database:".blue, getDatabaseUri().yellow);
console.log("-------------------------------".bgWhite);

module.exports = {
	SECRET_KEY,
	PORT,
	BCRYPT_WORK_FACTOR,
	getDatabaseUri,
};
