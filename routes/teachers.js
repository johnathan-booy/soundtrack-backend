"use strict";

/** Dependencies */
const express = require("express");
const Teacher = require("../models/teacher");
const { BadRequestError } = require("../expressError");
const teacherNewSchema = require("../schemas/teacherNewSchema");
const createToken = require("../helpers/createToken");
const { ensureAdmin } = require("../middleware/auth");

/** Initialize express router */
const router = new express.Router();

/**POST /teachers
 *
 * Adds a new teacher,
 *
 * This is not the registration endpoint --- instead this is for admin user to add new users
 *
 * Also, unlike /auth/register, the new teacher can be set as admin
 *
 * Admin must enter {email, password, name} and optionally include {description, isAdmin}
 *
 * Returns:
 * {teacher: {id, name, email, description, isAdmin}, token}
 *
 * Authorization is required: admin
 */
router.post("/", ensureAdmin, async function (req, res, next) {
	try {
		const validatedBody = await teacherNewSchema.validate(req.body, {
			abortEarly: false,
		});
		const teacher = await Teacher.register(validatedBody);
		const token = createToken(teacher);
		return res.status(201).json({ teacher, token });
	} catch (err) {
		if (err.name === "ValidationError") {
			return next(new BadRequestError(err.errors));
		}
		return next(err);
	}
});

module.exports = router;
