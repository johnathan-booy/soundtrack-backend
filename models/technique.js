const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");
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
			if (!tonic || !mode || !type) {
				throw new BadRequestError("Tonic, mode, and type cannot be null.");
			}
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
			if (err.code === "23505") {
				throw new BadRequestError(`Duplicate technique`);
			} else {
				throw err;
			}
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

			const querySql = `
        UPDATE techniques AS t
        SET ${setCols}
        FROM skill_levels AS sl
        WHERE sl.id = t.skill_level_id AND t.id = $${idVarIdx}
        RETURNING
          t.id,
          t.tonic,
          t.mode,
          t.type,
          t.description,
          sl.name AS "skillLevel",
          t.teacher_id AS "teacherId",
          t.date_added AS "dateAdded"
      `;

			const result = await db.query(querySql, [...values, id]);
			const technique = result.rows[0];

			if (!technique)
				throw new NotFoundError(`No technique found with id: ${id}`);

			return technique;
		} catch (err) {
			if (err.code === "23505") {
				throw new BadRequestError(`Duplicate technique for teacher`);
			} else if (err.code === "23502" && err.message.includes("tonic")) {
				throw new BadRequestError("Tonic cannot be null");
			} else if (err.code === "23502" && err.message.includes("mode")) {
				throw new BadRequestError("Mode cannot be null");
			} else if (err.code === "23502" && err.message.includes("type")) {
				throw new BadRequestError("Type cannot be null");
			} else {
				throw err;
			}
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
