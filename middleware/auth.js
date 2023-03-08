"use strict";

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");

/**
 * Middleware that authenticates a JSON Web Token (JWT).
 * If a valid token is present in the request header, stores the token payload in res.locals.
 * If the token is absent or invalid, does not throw an error.
 */
function authJWT(req, res, next) {
	try {
		const authHeader = req.headers && req.headers.authorization;
		if (authHeader) {
			const token = authHeader.replace(/^[Bb]earer /, "").trim();
			res.locals.teacher = jwt.verify(token, SECRET_KEY);
		}
		return next();
	} catch {
		return next();
	}
}

/**
 * Middleware that ensures the teacher is logged in.
 * If not, throws an UnauthorizedError.
 */
function loggedIn(req, res, next) {
	try {
		if (!res.locals.teacher) throw new UnauthorizedError();
		return next();
	} catch (err) {
		return next(err);
	}
}

/**
 * Middleware that ensures the teacher is logged in as an admin.
 * If not, throws an UnauthorizedError.
 */
function admin(req, res, next) {
	try {
		if (!res.locals.teacher || !res.locals.teacher.isAdmin) {
			throw new UnauthorizedError();
		}
		return next();
	} catch (err) {
		return next(err);
	}
}

/**
 * Middleware that ensures the teacher is logged in as the correct teacher or an admin.
 * If not, throws an UnauthorizedError.
 */
function correctTeacherOrAdmin(req, res, next) {
	try {
		const teacher = res.locals.teacher;
		if (
			!(
				teacher &&
				(teacher.isAdmin ||
					teacher.id === req.params.id ||
					teacher.id === req.query.teacherId)
			)
		) {
			throw new UnauthorizedError();
		}
		return next();
	} catch (err) {
		return next(err);
	}
}

module.exports = {
	authJWT,
	loggedIn,
	admin,
	correctTeacherOrAdmin,
};
