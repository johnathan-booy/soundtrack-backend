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
const handlePostgresError = require("../helpers/handlePostgresError");

/** Functions for teachers */
class Teacher {
	/**
	 * Authenticate a teacher
	 *
	 * @param {string} email
	 * @param {string} password - unhashed password
	 *
	 * @returns {object} An object - {id, email, name, description, isAdmin} - of the newly registered teacher.
	 *
	 * @throws {UnauthorizedError} if the email is not found or the password is incorrect
	 */

	static async authenticate(email, password) {
		// Find the email in the database
		const result = await db.query(
			`
            SELECT 
                id, email, password, name, description, is_admin AS "isAdmin"
            FROM
                teachers
            WHERE
                email = $1`,
			[email]
		);

		// Get the teacher object from response
		const teacher = result.rows[0];

		// If the teacher exists, compare the param password with the hashed password
		if (teacher) {
			const isValidPassword = await bcrypt.compare(password, teacher.password);

			// If the passwords match, return the teacher object !!!WITHOUT THE PASSWORD!!!
			if (isValidPassword === true) {
				delete teacher.password;
				return teacher;
			}
		}

		// Throw an UnauthorizedError if we reach this point.
		throw new UnauthorizedError("Invalid email or password");
	}

	/**
	 * Register a new teacher in the database.
	 *
	 * @param {object} data - An object containing the teacher's name, email, password, and description.
	 *
	 * @returns {object} An object containing the name, email, and description of the newly registered teacher.
	 *
	 * @throws {BadRequestError} if the provided email already exists in the database.
	 */
	static async register({
		email,
		password,
		name,
		description,
		isAdmin = false,
	}) {
		try {
			const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

			const results = await db.query(
				`INSERT INTO teachers
            (email, password, name, description, is_admin)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, email, name, description, is_admin AS "isAdmin"`,
				[email, hashedPassword, name, description, isAdmin]
			);

			const teacher = results.rows[0];

			return teacher;
		} catch (err) {
			handlePostgresError(err);
		}
	}

	/** Get all teachers
	 *
	 * @returns {Array} [{id, name, email, description, isAdmin}]
	 */
	static async getAll() {
		const results = await db.query(`
			SELECT
				id, name, email, description, is_admin AS "isAdmin"
			FROM
				teachers
			ORDER BY
				date_added
		`);

		return results.rows;
	}

	/** Get teacher by id
	 *	@param {String} id teacher identifier
	 * 	@returns {Array} [{id, name, email, description, isAdmin}]
	 */
	static async get(id) {
		const results = await db.query(
			`
			SELECT
				id, name, email, description, is_admin AS "isAdmin"
			FROM
				teachers
			WHERE
				id = $1
		`,
			[id]
		);

		const teacher = results.rows[0];

		if (!teacher) throw new NotFoundError(`No teacher found with id: ${id}`);

		return teacher;
	}

	/**
	 * Update teacher with provided `data`.
	 *
	 * This is a "partial update" --- it's fine if `data` doesn't contain
	 * all the fields; this only changes provided ones.
	 *
	 * @param {string} id - teacher identifier
	 * @param {object} data - can include: { name, email, password, description, isAdmin }
	 *
	 * @returns {object} - { id, email, name, description, isAdmin }
	 *
	 * @throws {NotFoundError} if `id` is invalid
	 *
	 * WARNING: this function can set a new password or make a user an admin.
	 * If the inputs aren't validated, a serious security risk would be opened.
	 */
	static async update(id, data) {
		try {
			if (data.password) {
				data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
			}

			const { setCols, values } = sqlForPartialUpdate(data, {
				isAdmin: "is_admin",
			});
			const idVarIdx = values.length + 1;

			const querySql = `
						UPDATE teachers
						SET ${setCols}
						WHERE id = $${idVarIdx}
						RETURNING
							id,
							name,
							email,
							description,
							is_admin AS "isAdmin"`;

			const result = await db.query(querySql, [...values, id]);
			const teacher = result.rows[0];

			if (!teacher) throw new NotFoundError(`No teacher found with id: ${id}`);

			delete teacher.password;
			return teacher;
		} catch (err) {
			handlePostgresError(err);
		}
	}

	/** Delete given teacher from database; returns undefined
	 *	@param {String} id teacher identifier
	 */
	static async delete(id) {
		const results = await db.query(
			`
			DELETE FROM
				teachers
			WHERE
				id = $1
			RETURNING
				name
		`,
			[id]
		);

		const teacher = results.rows[0];

		if (!teacher) throw new NotFoundError(`No teacher found with id: ${id}`);
	}

	/** Get all students assigned to a teacher
	 *
	 * @param {string} id - teacher identifier
	 * @param {Object} searchFilters - All optional - {name, skillLevelId}
	 *
	 * @returns {Array} [{id, name, email, description, skillLevel}]
	 *
	 */
	static async getStudents(id, searchFilters = {}) {
		// Check that the teacher exists
		await Teacher.get(id);

		let query = `
                SELECT
                    s.id, s.name, s.email, s.description, lvl.name AS "skillLevel"
                FROM
                    students s
                JOIN
                    skill_levels lvl
                ON
                    lvl.id = s.skill_level_id
                `;
		let whereExpressions = [];
		let queryValues = [];

		const { name, skillLevelId } = searchFilters;

		// Add each search time that was provided to the whereExpressions and queryValues
		if (name) {
			queryValues.push(`%${name}%`);
			whereExpressions.push(`s.name ILIKE $${queryValues.length}`);
		}
		if (skillLevelId !== undefined) {
			queryValues.push(skillLevelId);
			whereExpressions.push(`s.skill_level_id = $${queryValues.length}`);
		}

		// We also need to query by teacher
		queryValues.push(id);
		whereExpressions.push(`s.teacher_id = $${queryValues.length}`);

		// Assemble the query
		if (whereExpressions.length > 0) {
			query += " WHERE " + whereExpressions.join(" AND ");
		}
		query += " ORDER BY name";

		const results = await db.query(query, queryValues);

		return results.rows;
	}

	/** Get all lessons conducted by a teacher
	 *
	 * @param {string} id - teacher identifier
	 * @param {Object} searchFilters - All optional - {daysAgo: 30}
	 *
	 * @returns {Array} [{id, studentName, date}]
	 *
	 */
	static async getLessons(id, searchFilters = { daysAgo: 30 }) {
		// Check that the teacher exists
		await Teacher.get(id);

		let query = `
					SELECT
						l.id, s.name AS "studentName", l.date
					FROM
						lessons l
					JOIN
						students s
					ON
						s.id = l.student_id
					`;
		let whereExpressions = [];
		let queryValues = [];

		const { daysAgo } = searchFilters;

		// Add each search time that was provided to the whereExpressions and queryValues
		if (daysAgo) {
			whereExpressions.push(`l.date > NOW() - INTERVAL '${daysAgo} days'`);
		}

		// We also need to query by teacher
		queryValues.push(id);
		whereExpressions.push(`l.teacher_id = $${queryValues.length}`);

		// Assemble the query
		if (whereExpressions.length > 0) {
			query += " WHERE " + whereExpressions.join(" AND ");
		}

		query += " ORDER BY date DESC";
		const results = await db.query(query, queryValues);

		return results.rows;
	}

	/** Get all techniques that were created by a teacher
	 *
	 * @param {string} id - teacher identifier
	 *
	 * @returns {Array} [{id, tonic, mode, type, description, dateAdded, skillLevel}]
	 *
	 */
	static async getTechniques(id) {
		// Check that the teacher exists
		await Teacher.get(id);

		const results = await db.query(
			`
			SELECT
				t.id, t.tonic, t.mode, t.type, t.description, t.date_added AS "dateAdded", lvl.name AS "skillLevel"
			FROM
				techniques t
			JOIN
				skill_levels lvl
			ON
				lvl.id = t.skill_level_id
			WHERE
				t.teacher_id = $1
			`,
			[id]
		);

		return results.rows;
	}

	/** Get all techniques that were created by a teacher
	 *
	 * @param {string} id - teacher identifier
	 *
	 * @returns {Array} [{id, name, composer, arranger, genre, sheetMusicUrl, description, dateAdded, skillLevel}]
	 *
	 */
	static async getRepertoire(id) {
		// Check that the teacher exists
		await Teacher.get(id);

		const results = await db.query(
			`
			SELECT
				r.id, r.name, r.composer, r.arranger, r.genre, 
				r.sheet_music_url AS "sheetMusicUrl", r.description, 
				r.date_added AS "dateAdded", lvl.name AS "skillLevel"
			FROM
				repertoire r
			JOIN
				skill_levels lvl
			ON
				lvl.id = r.skill_level_id
			WHERE
				r.teacher_id = $1
			`,
			[id]
		);

		return results.rows;
	}
}

module.exports = Teacher;
