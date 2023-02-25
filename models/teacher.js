"use strict";

const { BCRYPT_WORK_FACTOR } = require("../config");
const db = require("../db");
const bcrypt = require("bcrypt");
const {
	BadRequestError,
	UnauthorizedError,
	NotFoundError,
} = require("../expressError");
const { is } = require("../schemas/teacherRegisterSchema");
const { sqlForPartialUpdate } = require("../helpers/sqlForPartialUpdate");

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
		const checkForDuplicate = await db.query(
			`SELECT email FROM teachers WHERE email = $1`,
			[email]
		);
		if (checkForDuplicate.rows[0]) {
			throw new BadRequestError(`Email already exists: ${email}`);
		}

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
		if (data.email) {
			const checkForDuplicate = await db.query(
				`SELECT email FROM teachers WHERE email = $1`,
				[data.email]
			);
			if (checkForDuplicate.rows[0]) {
				throw new BadRequestError(`Email already exists: ${data.email}`);
			}
		}

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
}

module.exports = Teacher;
