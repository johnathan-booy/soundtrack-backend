"use strict";

const db = require("../db/db");
const { BadRequestError, NotFoundError } = require("../expressError");
const Technique = require("./technique");
const Repertoire = require("./repertoire");
const handlePostgresError = require("../helpers/handlePostgresError");
const Teacher = require("./teacher");
const { studentCols, studentMinCols, lessonMinCols } = require("./_columns");
const snakecaseKeys = require("snakecase-keys");

/** Functions for students */
class Student {
	/**
	 * Register a new student.
	 *
	 * @param {object} data - with `name`, `email`, and `teacherId` fields. Optional fields are `description` and `skillLevelId`.
	 *
	 * @returns {object} {id, name, email, description, skillLevelId, teacherId}
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
			const [student] = await db("students")
				.insert({
					name,
					email,
					teacher_id: teacherId,
					description,
					skill_level_id: skillLevelId,
				})
				.returning(studentCols);

			return student;
		} catch (err) {
			handlePostgresError(err);
		}
	}

	/**
	 * Get all students
	 *
	 * @param {Object} searchFilters - All optional - {teacherId, name, skillLevelId}
	 *
	 * @returns {Array} [{id, name, email, skillLevel}]
	 */
	static async getAll(searchFilters = {}) {
		const { teacherId, name, skillLevelId } = searchFilters;

		if (teacherId) await Teacher.get(teacherId);

		const results = await db("students")
			.select(studentMinCols)
			.modify((qb) => {
				if (teacherId) {
					qb.where({ teacher_id: teacherId });
				}
				if (name) {
					qb.where("name", "ilike", `%${name}%`);
				}
				if (skillLevelId !== undefined) {
					qb.where("skill_level_id", skillLevelId);
				}
			})
			.orderBy("name");

		return results;
	}

	/**
	 * Get student by id
	 *
	 * @param {number} studentId
	 * @param {string} teacherId
	 * @param {boolean} isAdmin
	 *
	 * @returns {Object} containing the student's `id`, `name`, `email`, `description`, `skillLevelId`, and `teacherId`.
	 * @throws {NotFoundError} if `studentId` or `teacherId` or the combination thereof is invalid
	 */
	static async get({ studentId, teacherId, isAdmin = false }) {
		const [student] = await db("students")
			.select(studentCols)
			.where({ id: studentId })
			.modify((qb) => {
				if (!isAdmin) {
					qb.where({ teacher_id: teacherId });
				}
			});

		if (!student)
			throw new NotFoundError(`No student found with id: ${studentId}`);

		return student;
	}

	/**
	 * Update student with provided `data`.
	 *
	 * This is a "partial update" --- it's fine if `data` doesn't contain
	 * all the fields; this only changes provided ones.
	 *
	 * @param {number} studentId
	 * @param {string} teacherId
	 * @param {boolean} isAdmin
	 * @param {object} data - can include: { name, email, teacherId, description, skillLevelId }f
	 *
	 * @returns {object} - { id, email, name, teacherId, description, skillLevelId }
	 *
	 * @throws {NotFoundError} if `studentId` or `teacherId` or the combination thereof is invalid
	 * @throws {BadRequestError} If the `skillLevelId` does not exist in the database, or the email already exists

	 * WARNING: this function can change the teacherId field of a student.
	 * If the inputs aren't validated, a serious data integrity risk would be opened.
	 */
	static async update({ studentId, teacherId, isAdmin = false, data }) {
		try {
			const snakeCaseData = snakecaseKeys(data, { deep: true });

			const [student] = await db("students")
				.where({ id: studentId })
				.update(snakeCaseData)
				.returning(studentCols)
				.modify((qb) => {
					if (!isAdmin) {
						qb.where({ teacher_id: teacherId });
					}
				});

			if (!student)
				throw new NotFoundError(`No student found with id: ${studentId}`);

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
		const [student] = await db("students").where({ id }).del(["id"]);

		if (!student) throw new NotFoundError(`No student found with id: ${id}`);
	}

	/**
	 * Get all lessons taken by a student
	 *
	 * @param {number} studentId
	 * @param {string} teacherId
	 * @param {boolean} isAdmin
	 * @param {Object} searchFilters - All optional - {daysAgo: 30}
	 *
	 * @returns {Array} {student : {...studentObject}, lessons : [{id, date}]}
	 *
	 */
	static async getLessons({
		studentId,
		teacherId,
		isAdmin = false,
		searchFilters = { daysAgo: 30 },
	}) {
		// Check that the student exists
		const student = await Student.get({ studentId, teacherId, isAdmin });

		const { daysAgo } = searchFilters;

		const lessons = await db("lessons")
			.select(lessonMinCols)
			.where("student_id", studentId)
			.modify((qb) => {
				if (daysAgo) {
					qb.where(
						"date",
						">",
						new Date(new Date() - daysAgo * 24 * 60 * 60 * 1000)
					);
				}
			})
			.orderBy("date", "desc");

		return { student, lessons };
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
		await Student.get({ studentId: id, isAdmin: true });

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
		await Student.get({ studentId: id, isAdmin: true });

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
			const { tonic, mode, type, description, teacherId, skillLevelId } =
				technique;

			return {
				id,
				dateAdded,
				tonic,
				mode,
				type,
				description,
				skillLevelId,
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
				skillLevelId,
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
				skillLevelId,
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
