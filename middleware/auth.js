"use strict";

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/**
 * authenticateJWT is a middleware function that checks if a valid token was provided.
 * if the token is present, the token payload is stored on res.locals
 * if the token is absent or invalid, no error should be thrown
 */
function authenticateJWT(req, res, next) {
	try {
		const authHeader = req.headers && req.headers.authorization;
		if (authHeader) {
			const token = authHeader.replace(/^[Bb]earer /, "").trim();
			res.locals.user = jwt.verify(token, SECRET_KEY);
		}
		return next();
	} catch {
		return next();
	}
}

module.exports = {
	authenticateJWT,
};
