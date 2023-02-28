"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sqlForPartialUpdate");
const Technique = require("./technique");
const Repertoire = require("./repertoire");
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
	 * @param {object} data - required `{teacherId, studentId}` - optional `{notes}`
	 *
	 * @returns {object} `{id, date, notes, studentId, teacherId}
	 *
	 * @throws {BadRequestError} If the `teacherId` or `skillLevelId` does not exist in the database, or the email already exists
	 */
	static async create({ teacherId, studentId, notes }) {
		try {
			const results = await db.query(
				`
				INSERT INTO	lessons
							(notes, student_id, teacher_id)
				VALUES 		($1, $2, $3)
				RETURNING 	id, date, notes, student_id AS "studentId",
							teacher_id AS "teacherId"
				`,

				[notes, studentId, teacherId]
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

	/**
	 * Get all techniques that have been assigned to a lesson
	 *
	 * @param {number} id - lesson identifier
	 * @param {object} searchFilters - 	`{ includeCompleted: true }`
	 *
	 * @returns {Array} [
	 * {id, tonic, mode, type, notes, completed, rating, student}
	 * ]
	 */
	static async getAllTechniques(id, searchFilters = {}) {
		// Check that the lesson exists

		await Lesson.get(id);

		let query = `
			SELECT 	t.id, t.tonic, t.mode, t.type, lt.completed,
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

	// /**
	//  * Get all repertoire assigned to a student
	//  *
	//  * @param {Number} id - student identifier
	//  * @param {Object} searchFilters - { includeCompleted: true }
	//  *
	//  * @returns {Array} [{id, name, composer, arranger, genre, sheetMusicUrl, completed, lastReview, nextReview}]
	//  */
	// static async getRepertoire(id, searchFilters = {}) {
	// 	// Check that the student exists
	// 	await Student.get(id);

	// 	let query = `
	// 	SELECT 	r.id, r.name, r.composer, r.arranger, r.genre, r.sheet_music_url as "sheetMusicUrl",
	// 			sr.completed_at IS NOT NULL as completed, sr.reviewed_at as "lastReview",
	// 			sr.reviewed_at + sr.review_interval as "nextReview"
	// 	FROM 	student_repertoire sr
	// 	JOIN 	repertoire r ON sr.repertoire_id = r.id`;

	// 	let whereExpressions = [];
	// 	let queryValues = [];

	// 	const { includeCompleted } = searchFilters;
	// 	queryValues.push(id);
	// 	whereExpressions.push(`sr.student_id = $${queryValues.length}`);

	// 	if (!includeCompleted) {
	// 		whereExpressions.push(
	// 			`sr.completed_at IS NULL OR sr.reviewed_at + sr.review_interval <= NOW()`
	// 		);
	// 	}

	// 	// Assemble the query
	// 	if (whereExpressions.length > 0) {
	// 		query += " WHERE " + whereExpressions.join(" AND ");
	// 	}
	// 	query += ` ORDER BY "nextReview"`;

	// 	// Make the request
	// 	const results = await db.query(query, queryValues);

	// 	return results.rows;
	// }

	// /**
	//  * Adds a technique_id to a student's list of assigned techniques
	//  *
	//  * @param {Object} data - {studentId, techniqueId, reviewIntervalDays}
	//  *
	//  * @returns {Object} {id, dateAdded, tonic, mode, type, description, skillLevel, teacherId, completed, lastReview, nextReview}
	//  *
	//  * @throws {BadRequestError} if 'studentId' or 'techniqueId' doesn't exist
	//  * @throws {BadRequestError} if the combination of 'studentId' and 'techniqueId' already exists in database
	//  * @throws {BadRequestError} if 'reviewIntervalDays' exists but is not a number
	//  */
	// static async addTechnique({ studentId, techniqueId, reviewIntervalDays }) {
	// 	try {
	// 		if (typeof reviewIntervalDays !== "number")
	// 			throw new BadRequestError("'reviewIntervalDays' must be a number");
	// 		let reviewInterval =
	// 			reviewIntervalDays !== undefined ? `${reviewIntervalDays} Days` : null;

	// 		// Assign the technique to the student
	// 		const result = await db.query(
	// 			`
	// 			INSERT INTO student_techniques (student_id, technique_id, review_interval)
	// 			VALUES ($1, $2, $3)
	// 			RETURNING id, date_added AS "dateAdded", completed_at IS NOT NULL as completed,
	// 			reviewed_at as "lastReview",
	// 			CASE
	// 				WHEN completed_at IS NOT NULL THEN NULL
	// 				WHEN reviewed_at IS NULL THEN NOW()::DATE
	// 				ELSE (reviewed_at + review_interval)::DATE
	// 			END as "nextReview"`,
	// 			[studentId, techniqueId, reviewInterval]
	// 		);

	// 		const technique = await Technique.get(techniqueId);
	// 		const { id, dateAdded, completed, lastReview, nextReview } =
	// 			result.rows[0];
	// 		const { tonic, mode, type, description, teacherId, skillLevel } =
	// 			technique;

	// 		return {
	// 			id,
	// 			dateAdded,
	// 			tonic,
	// 			mode,
	// 			type,
	// 			description,
	// 			skillLevel,
	// 			teacherId,
	// 			completed,
	// 			lastReview,
	// 			nextReview,
	// 		};
	// 	} catch (err) {
	// 		handlePostgresError(err);
	// 	}
	// }

	// /**
	//  * Adds a repertoire_id to a student's list of assigned repertoire
	//  *
	//  * @param {Object} data - {studentId, repertoireId, reviewIntervalDays}
	//  *
	//  * @returns {Object} {id, dateAdded, name, composer, arranger, genre, sheetMusicUrl, description, skillLevel, teacherId, completed, lastReview, nextReview}
	//  *
	//  * @throws {BadRequestError} if 'studentId' or 'repertoireId' doesn't exist
	//  * @throws {BadRequestError} if the combination of 'studentId' and 'repertoireId' already exists in database
	//  * @throws {BadRequestError} if 'reviewIntervalDays' exists but is not a number
	//  */
	// static async addRepertoire({ studentId, repertoireId, reviewIntervalDays }) {
	// 	try {
	// 		if (typeof reviewIntervalDays !== "number")
	// 			throw new BadRequestError("'reviewIntervalDays' must be a number");
	// 		let reviewInterval =
	// 			reviewIntervalDays !== undefined ? `${reviewIntervalDays} Days` : null;

	// 		// Assign the repertoire to the student
	// 		const result = await db.query(
	// 			`
	// 				INSERT INTO student_repertoire (student_id, repertoire_id, review_interval)
	// 				VALUES ($1, $2, $3)
	// 				RETURNING id, date_added AS "dateAdded", completed_at IS NOT NULL as completed,
	// 				reviewed_at as "lastReview",
	// 				CASE
	// 					WHEN completed_at IS NOT NULL THEN NULL
	// 					WHEN reviewed_at IS NULL THEN NOW()::DATE
	// 					ELSE (reviewed_at + review_interval)::DATE
	// 				END as "nextReview"`,
	// 			[studentId, repertoireId, reviewInterval]
	// 		);

	// 		const repertoire = await Repertoire.get(repertoireId);
	// 		const { id, dateAdded, completed, lastReview, nextReview } =
	// 			result.rows[0];
	// 		const {
	// 			name,
	// 			composer,
	// 			arranger,
	// 			genre,
	// 			sheetMusicUrl,
	// 			description,
	// 			teacherId,
	// 			skillLevel,
	// 		} = repertoire;

	// 		return {
	// 			id,
	// 			dateAdded,
	// 			name,
	// 			composer,
	// 			arranger,
	// 			genre,
	// 			sheetMusicUrl,
	// 			description,
	// 			skillLevel,
	// 			teacherId,
	// 			completed,
	// 			lastReview,
	// 			nextReview,
	// 		};
	// 	} catch (err) {
	// 		handlePostgresError(err);
	// 	}
	// }

	// /**
	//  * Deletes an assigned technique from a student's list of assigned techniques
	//  * @param {Number} studentId - the id of the student
	//  * @param {Number} techniqueId - the id of the technique
	//  * @returns {undefined}
	//  * @throws {NotFoundError} If the technique has not been assigned to the given student
	//  */
	// static async deleteTechnique(studentId, techniqueId) {
	// 	const result = await db.query(
	// 		`DELETE FROM student_techniques
	// 	   WHERE student_id = $1 AND technique_id = $2
	// 	   RETURNING student_id`,
	// 		[studentId, techniqueId]
	// 	);
	// 	if (result.rows.length === 0) {
	// 		throw new NotFoundError(
	// 			`Technique with id ${techniqueId} has not been assigned to student with id ${studentId}`
	// 		);
	// 	}
	// }

	// /**
	//  * Deletes an assigned repertoire from a student's list of assigned repertoire
	//  * @param {Number} studentId - the id of the student
	//  * @param {Number} repertoireId - the id of the repertoire
	//  * @returns {undefined}
	//  * @throws {NotFoundError} If the repertoire has not been assigned to the given student
	//  */
	// static async deleteRepertoire(studentId, repertoireId) {
	// 	const result = await db.query(
	// 		`DELETE FROM student_repertoire
	// 	   WHERE student_id = $1 AND repertoire_id = $2
	// 	   RETURNING student_id`,
	// 		[studentId, repertoireId]
	// 	);
	// 	if (result.rows.length === 0) {
	// 		throw new NotFoundError(
	// 			`Repertoire with id ${repertoireId} has not been assigned to student with id ${studentId}`
	// 		);
	// 	}
	// }
}

if (process.env.NODE_ENV !== "test") {
	const test = async () => {
		const res = await Lesson.delete(5);
		console.log(res);
	};

	test();
}

module.exports = Lesson;
