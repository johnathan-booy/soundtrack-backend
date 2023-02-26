"use strict";

const { BCRYPT_WORK_FACTOR } = require("../config");
const db = require("../db");
const bcrypt = require("bcrypt");
const {
	BadRequestError,
	UnauthorizedError,
	NotFoundError,
} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sqlForPartialUpdate");

/** Functions for students */
class Student {
	/**
	 * Register a new student.
	 *
	 * @param {object} data - with `name`, `email`, and `teacherId` fields. Optional fields are `description` and `skillLevelId`.
	 *
	 * @returns {object}containing the registered student's `id`, `name`, `email`, `description`, `skillLevelId`, and `teacherId`.
	 *
	 * @throws {BadRequestError} If the `teacherId` or `skillLevelId` does not exist in the database, or the email already exists
	 */
	static async create({
		name,
		email,
		teacherId,
		description = null,
		skillLevelId = null,
	}) {
		try {
			const results = await db.query(
				`INSERT INTO students
				(name, email, teacher_id, description, skill_level_id)
				VALUES ($1, $2, $3, $4, $5)
				RETURNING id, name, email, description, skill_level_id AS "skillLevelId", teacher_id AS "teacherId"`,
				[name, email, teacherId, description, skillLevelId]
			);

			const student = results.rows[0];

			return student;
		} catch (err) {
			if (err.code === "23503") {
				const [_, key] = err.detail.match(/Key \((.*?)\)/);
				throw new BadRequestError(`${key} is invalid`);
			} else if (err.code === "23505") {
				throw new BadRequestError(`Email already exists.`);
			} else {
				throw err;
			}
		}
	}

	/**
	 * Get all students.
	 *
	 * @returns {Array} containing all students with their `id`, `name`, `email`, `description`, `skillLevelId`, and `teacherId`.
	 */
	static async getAll() {
		const results = await db.query(`
      SELECT
        id, name, email, description, skill_level_id AS "skillLevelId", teacher_id AS "teacherId"
      FROM
        students
      ORDER BY
        id
    `);

		return results.rows;
	}

	/**
	 * Get student by id
	 *
	 * @param {String} id - student identifier
	 * @returns {Object} containing the student's `id`, `name`, `email`, `description`, `skillLevelId`, and `teacherId`.
	 * @throws {NotFoundError} If no student is found with the given id.
	 */
	static async get(id) {
		const result = await db.query(
			`SELECT
				id, name, email, description, skill_level_id AS "skillLevelId", teacher_id AS "teacherId"
			FROM
				students
			WHERE
				id = $1`,
			[id]
		);

		const student = result.rows[0];

		if (!student) throw new NotFoundError(`No student found with id: ${id}`);

		return student;
	}

	/**
	 * Update student with provided `data`.
	 *
	 * This is a "partial update" --- it's fine if `data` doesn't contain
	 * all the fields; this only changes provided ones.
	 *
	 * @param {string} id - student identifier
	 * @param {object} data - can include: { name, email, teacherId, description, skillLevelId }
	 *
	 * @returns {object} - { id, email, name, teacherId, description, skillLevelId }
	 *
	 * @throws {NotFoundError} if `id` is invalid
	 * @throws {BadRequestError} If the `teacherId` or `skillLevelId` does not exist in the database, or the email already exists

	 * WARNING: this function can change the teacherId field of a student.
	 * If the inputs aren't validated, a serious data integrity risk would be opened.
	 */
	static async update(id, data) {
		try {
			const { setCols, values } = sqlForPartialUpdate(data, {
				teacherId: "teacher_id",
				skillLevelId: "skill_level_id",
			});
			const idVarIdx = values.length + 1;

			const querySql = `
				UPDATE students
				SET ${setCols}
				WHERE id = $${idVarIdx}
				RETURNING
					id,
					name,
					email,
					teacher_id AS "teacherId",
					description,
					skill_level_id AS "skillLevelId"`;

			const result = await db.query(querySql, [...values, id]);
			const student = result.rows[0];

			if (!student) throw new NotFoundError(`No student found with id: ${id}`);

			return student;
		} catch (err) {
			if (err.code === "23503") {
				const [_, key] = err.detail.match(/Key \((.*?)\)/);
				throw new BadRequestError(`${key} is invalid`);
			} else if (err.code === "23505") {
				throw new BadRequestError(`Email already exists.`);
			} else {
				throw err;
			}
		}
	}

	/**
	 * Delete given student from database; returns undefined
	 * @param {String} id student identifier
	 */
	static async delete(id) {
		const results = await db.query(
			`
        DELETE FROM
            students
        WHERE
            id = $1
        RETURNING
            name
    `,
			[id]
		);

		const student = results.rows[0];

		if (!student) throw new NotFoundError(`No student found with id: ${id}`);
	}

	/**
	 * Get all lessons taken by a student
	 *
	 * @param {string} id - student identifier
	 * @param {Object} searchFilters - All optional - {daysAgo: 30}
	 *
	 * @returns {Array} [{id, teacherName, date}]
	 *
	 */
	static async getLessons(id, searchFilters = { daysAgo: 30 }) {
		// Check that the student exists
		await Student.get(id);

		let query = `
                SELECT
                    l.id, t.name AS "teacherName", l.date
                FROM
                    lessons l
                JOIN
                    teachers t
                ON
                    t.id = l.teacher_id
                `;
		let whereExpressions = [];
		let queryValues = [];

		const { daysAgo } = searchFilters;

		// Add each search time that was provided to the whereExpressions and queryValues
		if (daysAgo) {
			whereExpressions.push(`l.date > NOW() - INTERVAL '${daysAgo} days'`);
		}

		// We also need to query by student
		queryValues.push(id);
		whereExpressions.push(`l.student_id = $${queryValues.length}`);

		// Assemble the query
		if (whereExpressions.length > 0) {
			query += " WHERE " + whereExpressions.join(" AND ");
		}

		query += " ORDER BY date DESC";
		const results = await db.query(query, queryValues);

		return results.rows;
	}

	// /** Get all techniques that were created by a teacher
	//  *
	//  * @param {string} id - teacher identifier
	//  *
	//  * @returns {Array} [{id, tonic, mode, type, description, dateAdded, skillLevel}]
	//  *
	//  */
	// static async getTechniques(id) {
	// 	// Check that the teacher exists
	// 	await Teacher.get(id);

	// 	const results = await db.query(
	// 		`
	// 		SELECT
	// 			t.id, t.tonic, t.mode, t.type, t.description, t.date_added AS "dateAdded", lvl.name AS "skillLevel"
	// 		FROM
	// 			techniques t
	// 		JOIN
	// 			skill_levels lvl
	// 		ON
	// 			lvl.id = t.skill_level_id
	// 		WHERE
	// 			t.teacher_id = $1
	// 		`,
	// 		[id]
	// 	);

	// 	return results.rows;
	// }

	// /** Get all techniques that were created by a teacher
	//  *
	//  * @param {string} id - teacher identifier
	//  *
	//  * @returns {Array} [{id, name, composer, arranger, genre, sheetMusicUrl, description, dateAdded, skillLevel}]
	//  *
	//  */
	// static async getRepertoire(id) {
	// 	// Check that the teacher exists
	// 	await Teacher.get(id);

	// 	const results = await db.query(
	// 		`
	// 		SELECT
	// 			r.id, r.name, r.composer, r.arranger, r.genre,
	// 			r.sheet_music_url AS "sheetMusicUrl", r.description,
	// 			r.date_added AS "dateAdded", lvl.name AS "skillLevel"
	// 		FROM
	// 			repertoire r
	// 		JOIN
	// 			skill_levels lvl
	// 		ON
	// 			lvl.id = r.skill_level_id
	// 		WHERE
	// 			r.teacher_id = $1
	// 		`,
	// 		[id]
	// 	);

	// 	return results.rows;
	// }
}

module.exports = Student;
