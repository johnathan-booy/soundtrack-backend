"use strict";

const express = require("express");
const { BadRequestError, UnauthorizedError } = require("../expressError");
const { correctTeacherOrAdmin } = require("../middleware/auth");
const Student = require("../models/student");
const studentSearchSchema = require("../schemas/studentSearchSchema");

/** Initialize express router */
const router = new express.Router();

router.get("/", correctTeacherOrAdmin, async function (req, res, next) {
	/** GET /teachers/:id/students
	 *
	 * Endpoint to get a teachers students
	 *
	 * teacherId is required in query string if not admin
	 *
	 * Optional filtering - name, skillLevelId
	 *
	 * Returns:
	 * {students: [{id, name, email, description, skillLevel}]}
	 *
	 * Authorization is required: admin or same teacher as teacherId
	 */

	// Get queries
	const q = req.query;

	const teacher = res.locals.teacher;

	if (q.skillLevelId !== undefined) q.skillLevelId = +q.skillLevelId;

	try {
		// Non-admin users cannot access another teachers students
		if (teacher.isAdmin === false) {
			if (q.teacherId !== undefined) {
				if (q.teacherId !== teacher.id) throw new UnauthorizedError();
			} else {
				q.teacherId = teacher.id;
			}
		}
		const validatedQuery = await studentSearchSchema.validate(q, {
			abortEarly: false,
		});

		const students = await Student.getAll(validatedQuery);
		return res.json({ students });
	} catch (err) {
		if (err.name === "ValidationError") {
			return next(new BadRequestError(err.errors));
		}
		return next(err);
	}
});

module.exports = router;
