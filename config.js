"use strict";

/** Shared config file for application */

const SECRET_KEY = process.env.SECRET_KEY || "secret-dev";
const PORT = +process.env.PORT || 3001;
const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 13;

module.exports = {
	SECRET_KEY,
	PORT,
	BCRYPT_WORK_FACTOR,
};
