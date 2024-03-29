"use strict";

const express = require("express");
const { BadRequestError, UnauthorizedError } = require("../expressError");
const { correctTeacherOrAdmin, loggedIn } = require("../middleware/auth");
const Student = require("../models/student");
const lessonSearchSchema = require("../schemas/lessonSearchSchema");
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
	 * Authorization is required: admin or matching teacherId in JWT token
	 */

	// Get queries
	const q = req.query;

	if (q.skillLevelId !== undefined) q.skillLevelId = +q.skillLevelId;

	try {
		const validatedQuery = await studentSearchSchema.validate(q);

		const students = await Student.getAll(validatedQuery);
		return res.json({ students });
	} catch (err) {
		if (err.name === "ValidationError") {
			return next(new BadRequestError(err.errors[0]));
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
	 * Authorization is required: admin or matching teacherId in JWT token
	 */
	try {
		const { id: studentId } = req.params;
		const { id: teacherId, isAdmin } = res.locals.teacher;

		const student = await Student.get({
			studentId,
			teacherId,
			isAdmin,
		});

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
	 * Authorization is required: admin or matching teacherId in JWT token
	 */
	try {
		const validatedBody = await studentNewSchema.validate(req.body);
		const student = await Student.create(validatedBody);
		return res.status(201).json({ student });
	} catch (err) {
		if (err.name === "ValidationError") {
			return next(new BadRequestError(err.errors[0]));
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
	 * Authorization is required: admin or matching teacherId in JWT token
	 */
	try {
		const validatedBody = await studentUpdateSchema.validate(req.body);

		const { id: studentId } = req.params;
		const { id: teacherId, isAdmin } = res.locals.teacher;

		const student = await Student.update({
			studentId,
			teacherId,
			isAdmin,
			data: validatedBody,
		});

		return res.json({ student });
	} catch (err) {
		if (err.name === "ValidationError") {
			return next(new BadRequestError(err.errors[0]));
		}
		return next(err);
	}
});

router.delete("/:id", loggedIn, async function (req, res, next) {
	/** DELETE /students/:id
	 *
	 * Endpoint to delete a student by their ID.
	 *
	 * Returns:
	 * { deleted: id }
	 *
	 * Authorization is required: admin or matching teacherId in JWT token
	 */
	try {
		const { id: studentId } = req.params;
		const { id: teacherId, isAdmin } = res.locals.teacher;

		await Student.get({
			studentId,
			teacherId,
			isAdmin,
		});

		await Student.delete(studentId);

		return res.json({ deleted: +studentId });
	} catch (err) {
		return next(err);
	}
});

router.get("/:id/lessons", loggedIn, async function (req, res, next) {
	/** GET /students/:id/lessons
	 *
	 * Endpoint to get a student's lessons
	 *
	 * Optional filtering - daysAgo
	 *
	 * Returns:
	 * {lessons: [{id, studentName, date}]}
	 *
	 * Authorization is required: admin or matching teacherId in JWT token
	 */

	// Get queries
	const q = req.query;
	if (q.daysAgo !== undefined) {
		q.daysAgo = +q.daysAgo;
	} else {
		q.daysAgo = 30;
	}

	try {
		const { id: studentId } = req.params;
		const { id: teacherId, isAdmin } = res.locals.teacher;
		const validatedQuery = await lessonSearchSchema.validate(q);
		const { student, lessons } = await Student.getLessons({
			studentId,
			teacherId,
			isAdmin,
			searchFilters: validatedQuery,
		});
		return res.json({ lessons });
	} catch (err) {
		if (err.name === "ValidationError") {
			return next(new BadRequestError(err.errors[0]));
		}
		return next(err);
	}
});

module.exports = router;
