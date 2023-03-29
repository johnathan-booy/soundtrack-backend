"use strict";

const express = require("express");
const { BadRequestError, UnauthorizedError } = require("../expressError");
const { correctTeacherOrAdmin, loggedIn } = require("../middleware/auth");
const Lesson = require("../models/lesson");
const lessonNewSchema = require("../schemas/lessonNewSchema");
const lessonUpdateSchema = require("../schemas/lessonUpdateSchema");

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
	 * Authorization is required: admin or matching teacherId in JWT token
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
	 * Authorization is required: admin or matching teacherId in JWT token
	 */
	try {
		const { id: lessonId } = req.params;
		const { id: teacherId, isAdmin } = res.locals.teacher;
		const validatedBody = await lessonUpdateSchema.validate(req.body);

		const updatedLesson = await Lesson.update({
			lessonId,
			teacherId,
			isAdmin,
			data: validatedBody,
		});

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
	 * Authorization is required: admin or matching teacherId in JWT token
	 */
	try {
		const { id: lessonId } = req.params;
		const { id: teacherId, isAdmin } = res.locals.teacher;
		await Lesson.get({ lessonId, teacherId, isAdmin });

		await Lesson.delete(req.params.id);
		return res.json({ deleted: +lessonId });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
