const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");
const handlePostgresError = require("../helpers/handlePostgresError");
const { sqlForPartialUpdate } = require("../helpers/sqlForPartialUpdate");

class Technique {
	/**
	 * Retrieve all techniques in the database.
	 *
	 * @returns {Array} An array of techniques [{id, tonic, mode, type, description, skillLevelId, dateAdded, teacherId}]
	 */
	static async getAll() {
		const results = await db.query(
			`
				SELECT 	id, tonic, mode, type, description, 
						skill_level_id AS "skillLevelId", date_added AS "dateAdded", 
						teacher_id AS "teacherId"
				FROM 	techniques
				ORDER BY date_added DESC
			`
		);
		return results.rows;
	}

	/**
	 * Get a technique by id.
	 *
	 * @param {Number} id - ID of technique to retrieve
	 *
	 * @returns {Object} {id, tonic, mode, type, description, dateAdded, teacherId, skillLevelId}
	 *
	 * @throws {NotFoundError} If technique is not found.
	 */

	static async get(id) {
		const res = await db.query(
			`SELECT id, tonic, mode, type, description, date_added AS "dateAdded",
                    teacher_id AS "teacherId", skill_level_id AS "skillLevelId"
            FROM techniques
            WHERE id = $1`,
			[id]
		);

		const technique = res.rows[0];

		if (!technique) throw new NotFoundError(`No technique with id: ${id}`);

		return technique;
	}

	/**
	 * Create a new technique and add it to the database.
	 *
	 * @param {object} data - An object containing the new technique's `tonic`, `mode`, `type`, `description`, `skillLevelId`, and `teacherId`.
	 *
	 * @returns {object}{id, tonic, mode, type, description, dateAdded, teacherId, skillLevelId}
	 *
	 * @throws {BadRequestError} if the provided technique already exists in the database.
	 */
	static async create({
		tonic,
		mode,
		type,
		description,
		skillLevelId,
		teacherId,
	}) {
		try {
			if (!teacherId) throw new BadRequestError("teacherId is required");

			const res = await db.query(
				`
                INSERT INTO techniques (tonic, mode, type, description, skill_level_id, teacher_id)
                VALUES      ($1, $2, $3, $4, $5, $6)
                RETURNING   id, tonic, mode, type, description, date_added AS "dateAdded",
                            skill_level_id AS "skillLevelId", teacher_id AS "teacherId"`,
				[tonic, mode, type, description, skillLevelId, teacherId]
			);
			return res.rows[0];
		} catch (err) {
			handlePostgresError(err);
		}
	}

	/**
	 * Update technique with `id` and `data`.
	 *
	 * This is a "partial update" --- it's fine if `data` doesn't contain
	 * all the fields; this only changes provided ones.
	 *
	 * @param {number} id - technique identifier
	 * @param {object} data - can include: {tonic, mode, type, description, skillLevelId}
	 *
	 * @returns {object} - { id, tonic, mode, type, description, skillLevel, teacherId, dateAdded }
	 *
	 * @throws {NotFoundError} if `id` is invalid
	 */
	static async update(id, data) {
		try {
			const { setCols, values } = sqlForPartialUpdate(data, {
				skillLevelId: "skill_level_id",
				teacherId: "teacher_id",
			});
			const idVarIdx = values.length + 1;

			// Step 1: Update the technique item without the skillLevel field
			let querySql = `
            UPDATE techniques AS t
            SET ${setCols}
            WHERE t.id = $${idVarIdx}
            RETURNING
              t.id,
              t.tonic,
              t.mode,
              t.type,
              t.description,
              t.date_added AS "dateAdded",
              t.skill_level_id AS "skillLevelId",
              t.teacher_id AS "teacherId"
          `;
			let result = await db.query(querySql, [...values, id]);
			let technique = result.rows[0];

			if (!technique) {
				throw new NotFoundError(`No technique found with id: ${id}`);
			}

			return technique;
		} catch (err) {
			handlePostgresError(err);
		}
	}

	/**
	 * Delete the technique with the given id.
	 *
	 * @param {number} id - technique identifier
	 *
	 * @throws {NotFoundError} if `id` is invalid
	 */
	static async delete(id) {
		const result = await db.query(
			`
            DELETE FROM techniques
            WHERE       id = $1
            RETURNING   id
            `,
			[id]
		);
		const technique = result.rows[0];

		if (!technique)
			throw new NotFoundError(`No technique found with id: ${id}`);
	}
}

module.exports = Technique;
