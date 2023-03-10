"use strict";

const express = require("express");
const { BadRequestError, UnauthorizedError } = require("../expressError");
const { correctTeacherOrAdmin, loggedIn } = require("../middleware/auth");
const Student = require("../models/student");
const studentNewSchema = require("../schemas/studentNewSchema");
const studentSearchSchema = require("../schemas/studentSearchSchema");
const studentUpdateSchema = require("../schemas/studentUpdateSchema");

/** Initialize express router */
const router = new express.Router();

router.get("/", correctTeacherOrAdmin, async function (req, res, next) {
	/** GET /students
	 *
	 * Endpoint to get a list of students
	 *
	 * teacherId is required in query string, if not admin
	 *
	 * Optional filtering - name, skillLevelId
	 *
	 * Returns:
	 * {students: [{id, name, email, skillLevelId}]}
	 *
	 * Authorization is required: admin or same teacher as teacherId
	 */

	// Get queries
	const q = req.query;

	const teacher = res.locals.teacher;

	if (q.skillLevelId !== undefined) q.skillLevelId = +q.skillLevelId;

	try {
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

router.get("/:id", loggedIn, async function (req, res, next) {
	/** GET /students/:id
	 *
	 * Endpoint to get information about a student by their ID.
	 *
	 * Returns:
	 * { id, name, email, description, skillLevelId, teacherId }
	 *
	 * Authorization is required: admin or same teacher as teacherId
	 */
	try {
		const student = await Student.get(req.params.id);

		const teacher = res.locals.teacher;
		if (!teacher.isAdmin && teacher.id !== student.teacherId) {
			throw new UnauthorizedError();
		}

		return res.json({ student });
	} catch (err) {
		return next(err);
	}
});

router.post("/", correctTeacherOrAdmin, async function (req, res, next) {
	/** POST /students
	 *
	 * Endpoint to add a new student
	 *
	 * must enter { name, email } and may optionally include { description, skillLevelId, teacherId }.
	 *
	 * Returns:
	 * { student : { id, name, email, description, skillLevelId, teacherId }}
	 *
	 * Authorization is required: admin or same teacher as teacherId
	 */
	try {
		const validatedBody = await studentNewSchema.validate(req.body, {
			abortEarly: false,
		});
		const student = await Student.create(validatedBody);
		return res.status(201).json({ student });
	} catch (err) {
		if (err.name === "ValidationError") {
			return next(new BadRequestError(err.errors));
		}
		return next(err);
	}
});

router.patch("/:id", loggedIn, async function (req, res, next) {
	/** PATCH /students/:id
	 *
	 * Endpoint to update a student's information.
	 *
	 * This is a "partial update", meaning it is not necessary to include all fields. Only the fields
	 * provided in the request will be updated.
	 *
	 * Data can include: { name, email, description, skillLevelId }
	 *
	 * Returns:
	 * { id, name, email, description, skillLevelId, teacherId }
	 *
	 * Authorization is required: admin or same teacher as teacherId
	 */
	try {
		const validatedBody = await studentUpdateSchema.validate(req.body);
		const student = await Student.update(req.params.id, validatedBody);

		const teacher = res.locals.teacher;
		if (!teacher.isAdmin && teacher.id !== student.teacherId) {
			throw new UnauthorizedError();
		}
		return res.json({ student });
	} catch (err) {
		if (err.name === "ValidationError") {
			return next(new BadRequestError(err.errors[0]));
		}
		return next(err);
	}
});

module.exports = router;
