"use strict";

const express = require("express");
const { BadRequestError, UnauthorizedError } = require("../expressError");
const { correctTeacherOrAdmin, loggedIn } = require("../middleware/auth");
const Lesson = require("../models/lesson");
const Student = require("../models/student");
const lessonNewSchema = require("../schemas/lessonNewSchema");
const lessonSearchSchema = require("../schemas/lessonSearchSchema");
const lessonUpdateSchema = require("../schemas/lessonUpdateSchema");
const studentNewSchema = require("../schemas/studentNewSchema");
const studentSearchSchema = require("../schemas/studentSearchSchema");
const studentUpdateSchema = require("../schemas/studentUpdateSchema");

/** Initialize express router */
const router = new express.Router();

router.post("/", correctTeacherOrAdmin, async function (req, res, next) {
	/** POST /lessons
	 *
	 * Endpoint to add a new lesson
	 *
	 * must enter { studentId, teacherId } and may optionally include { date, notes }
	 *
	 * Returns:
	 * { lesson : { id, date, notes, studentId, teacherId }}
	 *
	 * Authorization is required: admin or same teacher as teacherId
	 */
	try {
		const validatedBody = await lessonNewSchema.validate(req.body);
		const lesson = await Lesson.create(validatedBody);
		return res.status(201).json({ lesson });
	} catch (err) {
		if (err.name === "ValidationError") {
			return next(new BadRequestError(err.errors[0]));
		}
		return next(err);
	}
});

router.patch("/:id", loggedIn, async function (req, res, next) {
	/** PATCH /lessons/:id
	 *
	 * Endpoint to update a lesson's information.
	 *
	 * This is a "partial update", meaning it is not necessary to include all fields. Only the fields
	 * provided in the request will be updated.
	 *
	 * Data can include: { studentId, teacherId, date, notes }
	 *
	 * Returns:
	 * { lesson : { id, date, notes, studentId, teacherId }}
	 *
	 * Authorization is required: admin or same teacher as teacherId
	 */
	try {
		// Validate the data
		const validatedBody = await lessonUpdateSchema.validate(req.body);

		// Check that the lesson exists
		const lesson = await Lesson.get(req.params.id);

		// Ensure that:
		// the teacher is admin OR matches teacherId in original lesson
		const teacher = res.locals.teacher;
		if (!teacher.isAdmin && teacher.id !== lesson.teacherId) {
			throw new UnauthorizedError();
		}

		// Also make sure that non-admin teachers cannot change the teacherId
		if (
			!teacher.isAdmin &&
			validatedBody.teacherId &&
			validatedBody.teacherId !== teacher.id
		) {
			throw new UnauthorizedError();
		}

		const updatedLesson = await Lesson.update(req.params.id, validatedBody);

		return res.json({ lesson: updatedLesson });
	} catch (err) {
		if (err.name === "ValidationError") {
			return next(new BadRequestError(err.errors[0]));
		}
		return next(err);
	}
});

router.delete("/:id", loggedIn, async function (req, res, next) {
	/** DELETE /lessons/:id
	 *
	 * Endpoint to delete a lesson by ID.
	 *
	 * Returns:
	 * { deleted: id }
	 *
	 * Authorization is required: admin or same teacher as teacherId
	 */
	try {
		const lesson = await Lesson.get(req.params.id);
		const teacher = res.locals.teacher;
		if (!teacher.isAdmin && teacher.id !== lesson.teacherId) {
			throw new UnauthorizedError();
		}
		await Lesson.delete(req.params.id);
		return res.json({ deleted: +req.params.id });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
