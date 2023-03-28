"use strict";

const { BCRYPT_WORK_FACTOR } = require("../config");
const db = require("../db/db");
const bcrypt = require("bcrypt");
const { UnauthorizedError, NotFoundError } = require("../expressError");
const handlePostgresError = require("../helpers/handlePostgresError");
const snakeCaseKeys = require("snakecase-keys");
const {
	teacherCols,
	repertoireCols,
	techniqueCols,
	repertoireMinCols,
	techniqueMinCols,
} = require("./_columns");

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

		const [teacher] = await db
			.select([...teacherCols, "password"])
			.from("teachers")
			.where({ email });

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

			const [teacher] = await db("teachers").returning(teacherCols).insert({
				email,
				password: hashedPassword,
				name,
				description,
				is_admin: isAdmin,
			});

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
		const results = await db.select(teacherCols).from("teachers");

		return results;
	}

	/** Get teacher by id
	 *	@param {String} id teacher identifier
	 * 	@returns {Array} [{id, name, email, description, isAdmin}]
	 */
	static async get(id) {
		try {
			const [teacher] = await db
				.select(teacherCols)
				.from("teachers")
				.where({ id });
			if (!teacher) throw new Error();
			return teacher;
		} catch (err) {
			throw new NotFoundError(`No teacher found with id: ${id}`);
		}
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

			const snakeCaseData = snakeCaseKeys(data, { deep: true });

			const [teacher] = await db("teachers")
				.where({ id })
				.update(snakeCaseData)
				.returning(teacherCols);

			if (!teacher) throw new NotFoundError(`No teacher found with id: ${id}`);

			delete teacher.password;
			return teacher;
		} catch (err) {
			handlePostgresError(err);
		}
	}

	/**
	 * Delete given teacher from database; returns undefined
	 * @param {String} id teacher identifier
	 */
	static async delete(id) {
		try {
			const [teacher] = await db("teachers").where("id", id).del(["name"]);
			if (!teacher) throw new Error();
		} catch (err) {
			throw new NotFoundError(`No teacher found with id: ${id}`);
		}
	}

	/**
	 * Get all lessons conducted by a teacher
	 *
	 * @param {string} id - teacher identifier
	 * @param {Object} searchFilters - All optional - {daysAgo: 30}
	 *
	 * @returns {Array} [{id, studentName, date}]
	 */
	static async getLessons(id, searchFilters = { daysAgo: 30 }) {
		// Check that the teacher exists
		await Teacher.get(id);

		const { daysAgo } = searchFilters;

		const results = await db("lessons")
			.select("lessons.id", "students.name AS studentName", "lessons.date")
			.join("students", "students.id", "lessons.student_id")
			.where("lessons.teacher_id", id)
			.modify((qb) => {
				if (daysAgo) {
					qb.where(
						"lessons.date",
						">",
						db.raw(`NOW() - INTERVAL '${daysAgo} days'`)
					);
				}
			})
			.orderBy("lessons.date", "desc");

		return results;
	}

	/** Get all techniques that were created by a teacher
	 *
	 * @param {string} id - teacher identifier
	 *
	 * @returns {Array} [{id, tonic, mode, type, description, dateAdded, skillLevelId}]
	 *
	 */
	static async getTechniques(id) {
		// Check that the teacher exists
		await Teacher.get(id);

		const techniques = await db("techniques")
			.select(techniqueMinCols)
			.where({ teacher_id: id });

		return techniques;
	}

	/** Get all techniques that were created by a teacher
	 *
	 * @param {string} id - teacher identifier
	 *
	 * @returns {Array} [{id, name, composer, arranger, genre, sheetMusicUrl, description, dateAdded, skillLevelId}]
	 *
	 */
	static async getRepertoire(id) {
		// Check that the teacher exists
		await Teacher.get(id);

		const repertoire = db("repertoire")
			.select(repertoireMinCols)
			.where({ teacher_id: id });

		return repertoire;
	}
}

module.exports = Teacher;
