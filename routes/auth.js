"use strict";

const express = require("express");
const Teacher = require("../models/teacher");
const { BadRequestError } = require("../expressError");
const teacherRegisterSchema = require("../schemas/teacherRegisterSchema");
const teacherAuthSchema = require("../schemas/teacherAuthSchema");
const createToken = require("../helpers/createToken");

const router = new express.Router();

router.post("/token", async function (req, res, next) {
	/** POST /auth/token
	 *
	 * Endpoint to generate a JWT token for a teacher based on their email and password.
	 *
	 * User must provide their email and password.
	 *
	 * Returns:
	 * { token }
	 *
	 * Authorization is not required for this route.
	 */

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

router.post("/register", async function (req, res, next) {
	/** POST /auth/register
	 *
	 * Endpoint to register a new teacher by entering their email, password, and name.
	 *
	 * User may also optionally include a description.
	 *
	 * Returns:
	 * { token }
	 *
	 * Authorization is not required for this route.
	 */

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
