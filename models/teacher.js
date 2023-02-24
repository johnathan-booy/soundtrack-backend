"use strict";

const { BCRYPT_WORK_FACTOR } = require("../config");
const db = require("../db");
const bcrypt = require("bcrypt");
const { BadRequestError, UnauthorizedError } = require("../expressError");
const { is } = require("../schemas/teacherRegisterSchema");

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

		console.log(password);
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
}

module.exports = Teacher;
