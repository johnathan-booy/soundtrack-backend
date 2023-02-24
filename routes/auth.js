"use strict";

/** Dependencies */
const express = require("express");
const Teacher = require("../models/teacher");
const { BadRequestError } = require("../expressError");
const teacherRegisterSchema = require("../schemas/teacherRegisterSchema");
const teacherAuthSchema = require("../schemas/teacherAuthSchema");
const createToken = require("../helpers/createToken");

/** Initialize express router */
const router = new express.Router();

/**

/** POST /auth/token
 *
 * User must enter email and password
 *
 * Returns JWT token to authenticate further requests
 *
 * Authorization is not required for this route
 */
router.post("/token", async function (req, res, next) {
	try {
		const validatedBody = await teacherAuthSchema.validate(req.body, {
			abortEarly: false,
		});
		const { email, password } = validatedBody;

		const teacher = await Teacher.authenticate(email, password);
		const token = createToken(teacher);
		return res.json({ token });
	} catch (err) {
		if (err.name === "ValidationError") {
			return next(new BadRequestError(err));
		}
		return next(err);
	}
});

/**POST /auth/register
 *
 * User must enter {email, password, name} and optionally include description
 *
 * Returns JWT token to authenticate further requests
 *
 * Authorization is not required for this route
 */
router.post("/register", async function (req, res, next) {
	try {
		const validatedBody = await teacherRegisterSchema.validate(req.body, {
			abortEarly: false,
		});
		const teacher = await Teacher.register(validatedBody);
		const token = createToken(teacher);
		return res.status(201).json({ token });
	} catch (err) {
		if (err.name === "ValidationError") {
			return next(new BadRequestError(err.errors));
		}
		return next(err);
	}
});

module.exports = router;
