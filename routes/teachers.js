"use strict";

/** Dependencies */
const express = require("express");
const Teacher = require("../models/teacher");
const { BadRequestError } = require("../expressError");
const teacherNewSchema = require("../schemas/teacherNewSchema");
const createToken = require("../helpers/createToken");
const { admin, correctTeacherOrAdmin } = require("../middleware/auth");
const teacherUpdateSchema = require("../schemas/teacherUpdateSchema");
const lessonSearchSchema = require("../schemas/lessonSearchSchema");

/** Initialize express router */
const router = new express.Router();

router.post("/", admin, async function (req, res, next) {
	/** POST /teachers
	 *
	 * Endpoint to add a new teacher by an admin user.
	 *
	 * Note that this is not the registration endpoint, and unlike the registration endpoint,
	 * a new teacher can be created with admin privileges.
	 *
	 * Admin must enter { email, password, name } and may optionally include { description, isAdmin }.
	 *
	 * Returns:
	 * { teacher: { id, name, email, description, isAdmin }, token }
	 *
	 * Authorization is required: admin
	 */
	try {
		const validatedBody = await teacherNewSchema.validate(req.body);
		const teacher = await Teacher.register(validatedBody);
		const token = createToken(teacher);
		return res.status(201).json({ teacher, token });
	} catch (err) {
		if (err.name === "ValidationError") {
			return next(new BadRequestError(err.errors[0]));
		}
		return next(err);
	}
});

router.get("/", admin, async function (req, res, next) {
	/** GET /teachers
	 *
	 * Endpoint to get a list of all teachers.
	 *
	 * Returns:
	 * { teachers: [ { id, name, email, description, isAdmin } ] }
	 *
	 * Authorization is required: admin
	 */
	try {
		const teachers = await Teacher.getAll();
		return res.json({ teachers });
	} catch (err) {
		return next(err);
	}
});

router.get("/:id", correctTeacherOrAdmin, async function (req, res, next) {
	/** GET /teachers/:id
	 *
	 * Endpoint to get information about a teacher by their ID.
	 *
	 * Returns:
	 * { id, name, email, description, isAdmin }
	 *
	 * Authorization is required: admin or matching teacherId in JWT token
	 */
	try {
		const teacher = await Teacher.get(req.params.id);
		return res.json({ teacher });
	} catch (err) {
		return next(err);
	}
});

router.patch("/:id", correctTeacherOrAdmin, async function (req, res, next) {
	/** PATCH /teachers/:id
	 *
	 * Endpoint to update a teacher's information.
	 *
	 * This is a "partial update", meaning it is not necessary to include all fields. Only the fields
	 * provided in the request will be updated.
	 *
	 * Data can include: { name, email, password, description, isAdmin }
	 *
	 * Returns:
	 * { id, name, email, description, isAdmin }
	 *
	 * @throws {NotFoundError} if `id` is invalid
	 *
	 * Authorization is required: admin or matching teacherId in JWT token
	 */
	try {
		const validatedBody = await teacherUpdateSchema.validate(req.body);
		const teacher = await Teacher.update(req.params.id, validatedBody);
		return res.json({ teacher });
	} catch (err) {
		if (err.name === "ValidationError") {
			return next(new BadRequestError(err.errors[0]));
		}
		return next(err);
	}
});

router.delete("/:id", correctTeacherOrAdmin, async function (req, res, next) {
	/** DELETE /teachers/:id
	 *
	 * Endpoint to delete a teacher by their ID.
	 *
	 * Returns:
	 * { deleted: id }
	 *
	 * Authorization is required: admin or matching teacherId in JWT token
	 */
	try {
		await Teacher.delete(req.params.id);
		return res.json({ deleted: req.params.id });
	} catch (err) {
		return next(err);
	}
});

router.get(
	"/:id/lessons",
	correctTeacherOrAdmin,
	async function (req, res, next) {
		/** GET /teachers/:id/lessons
		 *
		 * Endpoint to get a teachers lessons
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
			const validatedQuery = await lessonSearchSchema.validate(q);
			const lessons = await Teacher.getLessons(req.params.id, validatedQuery);
			return res.json({ lessons });
		} catch (err) {
			if (err.name === "ValidationError") {
				return next(new BadRequestError(err.errors[0]));
			}
			return next(err);
		}
	}
);

router.get(
	"/:id/techniques",
	correctTeacherOrAdmin,
	async function (req, res, next) {
		/** GET /teachers/:id/techniques
		 *
		 * Endpoint to get a list of techniques a teacher has added
		 *
		 * Returns:
		 * {
		 * techniques:
		 * [{id, tonic, mode, type, description, dateAdded, skillLevelId}],
		 * }
		 *
		 * Authorization is required: admin or matching teacherId in JWT token
		 */
		try {
			const techniques = await Teacher.getTechniques(req.params.id);
			return res.json({ techniques });
		} catch (err) {
			return next(err);
		}
	}
);

router.get(
	"/:id/repertoire",
	correctTeacherOrAdmin,
	async function (req, res, next) {
		/** GET /teachers/:id/repertoire
		 *
		 * Endpoint to get a list of repertoire a teacher has added
		 *
		 * Returns:
		 * {
		 * repertoire:
		 * [{id, name, composer, arranger, genre, sheetMusicUrl, description, dateAdded, skillLevelId}],
		 * }
		 *
		 * Authorization is required: admin or matching teacherId in JWT token
		 */
		try {
			const repertoire = await Teacher.getRepertoire(req.params.id);
			return res.json({ repertoire });
		} catch (err) {
			return next(err);
		}
	}
);

module.exports = router;
