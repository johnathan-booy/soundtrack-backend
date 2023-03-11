"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sqlForPartialUpdate");
const handlePostgresError = require("../helpers/handlePostgresError");

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
		const result = await db.query(
			`
			SELECT	l.id, l.date, l.notes, l.student_id AS "studentId", s.name AS "studentName",
					l.teacher_id AS "teacherId", t.name AS "teacherName"
			FROM	lessons l
			JOIN	students s ON s.id = l.student_id
			JOIN	teachers t ON t.id = l.teacher_id
			WHERE	l.id = $1`,
			[id]
		);

		const lesson = result.rows[0];

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
	static async create({ teacherId, studentId, notes, date = "NOW()" }) {
		try {
			const results = await db.query(
				`
				INSERT INTO	lessons
							(notes, student_id, teacher_id, date)
				VALUES 		($1, $2, $3, $4)
				RETURNING 	id, date, notes, student_id AS "studentId",
							teacher_id AS "teacherId"
				`,

				[notes, studentId, teacherId, date]
			);

			return results.rows[0];
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
			const { setCols, values } = sqlForPartialUpdate(data, {
				teacherId: "teacher_id",
				studentId: "student_id",
			});

			const idVarIdx = values.length + 1;

			const querySql = `
				UPDATE 		lessons
				SET 		${setCols}
				WHERE 		id = $${idVarIdx}
				RETURNING 	id, date, notes, student_id AS "studentId",
							teacher_id AS "teacherId"`;

			const result = await db.query(querySql, [...values, id]);
			const lesson = result.rows[0];

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
		const results = await db.query(
			`
	    DELETE FROM
	        lessons
	    WHERE
	        id = $1
	    RETURNING
	        id
	`,
			[id]
		);

		const student = results.rows[0];

		if (!student) throw new NotFoundError(`No lesson found with id: ${id}`);
	}
}

module.exports = Lesson;
