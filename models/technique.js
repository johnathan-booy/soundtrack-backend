const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");
const handlePostgresError = require("../helpers/handlePostgresError");
const { sqlForPartialUpdate } = require("../helpers/sqlForPartialUpdate");

class Technique {
	/**
	 * Retrieve all techniques in the database.
	 *
	 * @returns {Array} An array of techniques [{id, tonic, mode, type, description, skillLevel, dateAdded, teacherId}]
	 */
	static async getAll() {
		const results = await db.query(
			`
        SELECT t.id, t.tonic, t.mode, t.type, t.description, s.name AS "skillLevel", t.date_added AS "dateAdded", t.teacher_id AS "teacherId"
        FROM techniques t
        JOIN skill_levels s ON t.skill_level_id = s.id
        ORDER BY t.date_added DESC
      `
		);
		return results.rows;
	}

	/**
	 * Get a technique by id.
	 *
	 * @param {Number} id - ID of technique to retrieve
	 *
	 * @returns {Object} Technique object with the following properties:
	 * - id
	 * - tonic
	 * - mode
	 * - type
	 * - description
	 * - dateAdded
	 * - skillLevelId
	 * - teacherId
	 *
	 * @throws {NotFoundError} If technique is not found.
	 */

	static async get(id) {
		const res = await db.query(
			`SELECT t.id, t.tonic, t.mode, t.type, t.description, t.date_added AS "dateAdded",
                    t.teacher_id AS "teacherId", sl.name AS "skillLevel"
            FROM techniques AS t
            JOIN skill_levels AS sl ON t.skill_level_id = sl.id
            WHERE t.id = $1`,
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
	 * @returns {object} An object containing the `id`, `tonic`, `mode`, `type`, `description`, `dateAdded`, `skillLevel`, and `teacherId` of the newly created technique.
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
                            (SELECT name FROM skill_levels WHERE id=$5) AS "skillLevel", teacher_id AS "teacherId"`,
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

			// Step 2: Query the database again to get the updated technique item
			// with the skillLevel field joined from the skill_levels table
			querySql = `
            SELECT
              t.id,
              t.tonic,
              t.mode,
              t.type,
              t.description,
              t.date_added AS "dateAdded",
              sl.name AS "skillLevel",
              t.teacher_id AS "teacherId"
            FROM
              techniques AS t
              JOIN skill_levels AS sl ON sl.id = t.skill_level_id
            WHERE t.id = $1
          `;
			result = await db.query(querySql, [id]);
			technique = result.rows[0];

			return technique;
		} catch (err) {
			handlePostgresError(err);
		}
	}
	q;

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
