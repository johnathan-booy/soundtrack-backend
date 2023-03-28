"use strict";

const db = require("../db/db");
const { NotFoundError } = require("../expressError");
const handlePostgresError = require("../helpers/handlePostgresError");
const snakecaseKeys = require("snakecase-keys");
const { lessonCols } = require("./_columns");

/** Functions for lessons */
class Lesson {
	/**
	 * Get lesson by id
	 *
	 * @param {string} id - lesson identifier
	 * @returns {object} containing `id`, `date`, `notes`, `studentId`, `studentName`, `teacherId`, `teacherName`
	 * @throws {NotFoundError} If no lesson is found with the given id.
	 */
	static async get(id) {
		const lesson = await db("lessons as l")
			.select(
				"l.id",
				"l.date",
				"l.notes",
				"l.student_id AS studentId",
				"s.name AS studentName",
				"l.teacher_id AS teacherId",
				"t.name AS teacherName"
			)
			.join("students as s", "s.id", "l.student_id")
			.join("teachers as t", "t.id", "l.teacher_id")
			.where("l.id", id)
			.first();

		if (!lesson) throw new NotFoundError(`No lesson found with id: ${id}`);

		return lesson;
	}

	/**
	 * Create a new lesson.
	 *
	 * @param {object} data - required `{teacherId, studentId}` - optional `{notes, date}`
	 *
	 * @returns {object} `{id, date, notes, studentId, teacherId}
	 *
	 * @throws {BadRequestError} If the `teacherId` or `skillLevelId` does not exist in the database, or the email already exists
	 */
	static async create({ teacherId, studentId, notes, date = new Date() }) {
		try {
			const result = await db("lessons")
				.insert({ notes, student_id: studentId, teacher_id: teacherId, date })
				.returning(lessonCols);

			return result[0];
		} catch (err) {
			handlePostgresError(err);
		}
	}

	/**
	 * Update lesson with provided `data`.
	 *
	 * This is a "partial update" --- it's fine if `data` doesn't contain
	 * all the fields; this only changes provided ones.
	 *
	 * @param {number} id - lesson identifier
	 * @param {object} data - can include `{ date, notes, studentId, teacherId }`
	 *
	 * @returns {object} `{id, date, notes, studentId, teacherId}
	 *
	 * @throws {NotFoundError} if `id` is invalid
	 * @throws {BadRequestError} If the `teacherId` or `studentId` does not exist in the database
	 */
	static async update(id, data) {
		try {
			const snakeCaseData = snakecaseKeys(data, { deep: true });
			const [lesson] = await db("lessons")
				.where({ id })
				.update(snakeCaseData)
				.returning(lessonCols);

			if (!lesson) throw new NotFoundError(`No lesson found with id: ${id}`);

			return lesson;
		} catch (err) {
			handlePostgresError(err);
		}
	}

	/**
	 * Delete given lesson from database; returns undefined
	 * @param {number} id - lesson identifier
	 */
	static async delete(id) {
		const [lesson] = await db("lessons").where({ id }).del(["id"]);

		if (!lesson) throw new NotFoundError(`No lesson found with id: ${id}`);
	}
}

module.exports = Lesson;
