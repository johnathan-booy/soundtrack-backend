"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sqlForPartialUpdate");
const Technique = require("./technique");
const Repertoire = require("./repertoire");
const handlePostgresError = require("../helpers/handlePostgresError");

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
			handlePostgresError(err);
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
	 * @param {Number} id - student identifier
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
			handlePostgresError(err);
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
	 * @param {Number} id - student identifier
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
		query += " WHERE " + whereExpressions.join(" AND ");
		query += " ORDER BY date DESC";

		// Make the request
		const results = await db.query(query, queryValues);

		return results.rows;
	}

	/**
	 * Get all techniques that have been assigned to a student
	 *
	 * @param {String} teacherId - teacher identifier
	 * @param {Object} searchFilters - { includeCompleted: true }
	 *
	 * @returns {Array} [{id, tonic, mode, type, completed, lastReview, nextReview}]
	 */
	static async getTechniques(id, searchFilters = {}) {
		// Check that the teacher exists
		await Student.get(id);

		let query = `
	   SELECT 	t.id, t.tonic, t.mode, t.type, st.completed_at IS NOT NULL as completed,
				st.reviewed_at as "lastReview",
				st.reviewed_at + st.review_interval as "nextReview"
	   FROM	student_techniques st
	   JOIN 	techniques t ON st.technique_id = t.id`;
		let whereExpressions = [];
		let queryValues = [];

		const { includeCompleted } = searchFilters;

		queryValues.push(id);
		whereExpressions.push(`st.student_id = $${queryValues.length}`);

		if (!includeCompleted) {
			whereExpressions.push(
				`st.completed_at IS NULL OR st.reviewed_at + st.review_interval <= NOW()`
			);
		}

		// Assemble the query
		if (whereExpressions.length > 0) {
			query += " WHERE " + whereExpressions.join(" AND ");
		}
		query += ` ORDER BY "nextReview"`;

		// Make the request
		const results = await db.query(query, queryValues);

		return results.rows;
	}

	/**
	 * Get all repertoire assigned to a student
	 *
	 * @param {Number} id - student identifier
	 * @param {Object} searchFilters - { includeCompleted: true }
	 *
	 * @returns {Array} [{id, name, composer, arranger, genre, sheetMusicUrl, completed, lastReview, nextReview}]
	 */
	static async getRepertoire(id, searchFilters = {}) {
		// Check that the student exists
		await Student.get(id);

		let query = `
		SELECT 	r.id, r.name, r.composer, r.arranger, r.genre, r.sheet_music_url as "sheetMusicUrl",
				sr.completed_at IS NOT NULL as completed, sr.reviewed_at as "lastReview",
				sr.reviewed_at + sr.review_interval as "nextReview"
		FROM 	student_repertoire sr
		JOIN 	repertoire r ON sr.repertoire_id = r.id`;

		let whereExpressions = [];
		let queryValues = [];

		const { includeCompleted } = searchFilters;
		queryValues.push(id);
		whereExpressions.push(`sr.student_id = $${queryValues.length}`);

		if (!includeCompleted) {
			whereExpressions.push(
				`sr.completed_at IS NULL OR sr.reviewed_at + sr.review_interval <= NOW()`
			);
		}

		// Assemble the query
		if (whereExpressions.length > 0) {
			query += " WHERE " + whereExpressions.join(" AND ");
		}
		query += ` ORDER BY "nextReview"`;

		// Make the request
		const results = await db.query(query, queryValues);

		return results.rows;
	}

	/**
	 * Adds a technique_id to a student's list of assigned techniques
	 *
	 * @param {Object} data - {studentId, techniqueId, reviewIntervalDays}
	 *
	 * @returns {Object} {id, dateAdded, tonic, mode, type, description, skillLevel, teacherId, completed, lastReview, nextReview}
	 *
	 * @throws {BadRequestError} if 'studentId' or 'techniqueId' doesn't exist
	 * @throws {BadRequestError} if the combination of 'studentId' and 'techniqueId' already exists in database
	 * @throws {BadRequestError} if 'reviewIntervalDays' exists but is not a number
	 */
	static async addTechnique({ studentId, techniqueId, reviewIntervalDays }) {
		try {
			if (typeof reviewIntervalDays !== "number")
				throw new BadRequestError("'reviewIntervalDays' must be a number");
			let reviewInterval =
				reviewIntervalDays !== undefined ? `${reviewIntervalDays} Days` : null;

			// Assign the technique to the student
			const result = await db.query(
				`
				INSERT INTO student_techniques (student_id, technique_id, review_interval)
				VALUES ($1, $2, $3)
				RETURNING id, date_added AS "dateAdded", completed_at IS NOT NULL as completed,
				reviewed_at as "lastReview",
				CASE
					WHEN completed_at IS NOT NULL THEN NULL
					WHEN reviewed_at IS NULL THEN NOW()::DATE
					ELSE (reviewed_at + review_interval)::DATE
				END as "nextReview"`,
				[studentId, techniqueId, reviewInterval]
			);

			const technique = await Technique.get(techniqueId);
			const { id, dateAdded, completed, lastReview, nextReview } =
				result.rows[0];
			const { tonic, mode, type, description, teacherId, skillLevel } =
				technique;

			return {
				id,
				dateAdded,
				tonic,
				mode,
				type,
				description,
				skillLevel,
				teacherId,
				completed,
				lastReview,
				nextReview,
			};
		} catch (err) {
			handlePostgresError(err);
		}
	}

	/**
	 * Adds a repertoire_id to a student's list of assigned repertoire
	 *
	 * @param {Object} data - {studentId, repertoireId, reviewIntervalDays}
	 *
	 * @returns {Object} {id, dateAdded, name, composer, arranger, genre, sheetMusicUrl, description, skillLevel, teacherId, completed, lastReview, nextReview}
	 *
	 * @throws {BadRequestError} if 'studentId' or 'repertoireId' doesn't exist
	 * @throws {BadRequestError} if the combination of 'studentId' and 'repertoireId' already exists in database
	 * @throws {BadRequestError} if 'reviewIntervalDays' exists but is not a number
	 */
	static async addRepertoire({ studentId, repertoireId, reviewIntervalDays }) {
		try {
			if (typeof reviewIntervalDays !== "number")
				throw new BadRequestError("'reviewIntervalDays' must be a number");
			let reviewInterval =
				reviewIntervalDays !== undefined ? `${reviewIntervalDays} Days` : null;

			// Assign the repertoire to the student
			const result = await db.query(
				`
					INSERT INTO student_repertoire (student_id, repertoire_id, review_interval)
					VALUES ($1, $2, $3)
					RETURNING id, date_added AS "dateAdded", completed_at IS NOT NULL as completed,
					reviewed_at as "lastReview",
					CASE
						WHEN completed_at IS NOT NULL THEN NULL
						WHEN reviewed_at IS NULL THEN NOW()::DATE
						ELSE (reviewed_at + review_interval)::DATE
					END as "nextReview"`,
				[studentId, repertoireId, reviewInterval]
			);

			const repertoire = await Repertoire.get(repertoireId);
			const { id, dateAdded, completed, lastReview, nextReview } =
				result.rows[0];
			const {
				name,
				composer,
				arranger,
				genre,
				sheetMusicUrl,
				description,
				teacherId,
				skillLevel,
			} = repertoire;

			return {
				id,
				dateAdded,
				name,
				composer,
				arranger,
				genre,
				sheetMusicUrl,
				description,
				skillLevel,
				teacherId,
				completed,
				lastReview,
				nextReview,
			};
		} catch (err) {
			handlePostgresError(err);
		}
	}

	/**
	 * Deletes an assigned technique from a student's list of assigned techniques
	 * @param {Number} studentId - the id of the student
	 * @param {Number} techniqueId - the id of the technique
	 * @returns {undefined}
	 * @throws {NotFoundError} If the technique has not been assigned to the given student
	 */
	static async deleteTechnique(studentId, techniqueId) {
		const result = await db.query(
			`DELETE FROM student_techniques
		   WHERE student_id = $1 AND technique_id = $2
		   RETURNING student_id`,
			[studentId, techniqueId]
		);
		if (result.rows.length === 0) {
			throw new NotFoundError(
				`Technique with id ${techniqueId} has not been assigned to student with id ${studentId}`
			);
		}
	}

	/**
	 * Deletes an assigned repertoire from a student's list of assigned repertoire
	 * @param {Number} studentId - the id of the student
	 * @param {Number} repertoireId - the id of the repertoire
	 * @returns {undefined}
	 * @throws {NotFoundError} If the repertoire has not been assigned to the given student
	 */
	static async deleteRepertoire(studentId, repertoireId) {
		const result = await db.query(
			`DELETE FROM student_repertoire
		   WHERE student_id = $1 AND repertoire_id = $2
		   RETURNING student_id`,
			[studentId, repertoireId]
		);
		if (result.rows.length === 0) {
			throw new NotFoundError(
				`Repertoire with id ${repertoireId} has not been assigned to student with id ${studentId}`
			);
		}
	}
}

module.exports = Student;
