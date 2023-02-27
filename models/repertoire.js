const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");
const handlePostgresError = require("../helpers/handlePostgresError");
const { sqlForPartialUpdate } = require("../helpers/sqlForPartialUpdate");

class Repertoire {
	/**
	 * Retrieve all repertoire items in the database.
	 *
	 * @returns {Array} An array of repertoire items [{id, name, composer, arranger, genre, sheetMusicUrl, description, dateAdded, skillLevelId, teacherId}]
	 */
	static async getAll() {
		const results = await db.query(
			`
            SELECT r.id, r.name, r.composer, r.arranger, r.genre, r.sheet_music_url AS "sheetMusicUrl", r.description, r.date_added AS "dateAdded", sl.name AS "skillLevel", r.teacher_id AS "teacherId"
            FROM repertoire r
            JOIN skill_levels sl ON r.skill_level_id = sl.id
            ORDER BY r.name
        `
		);
		return results.rows;
	}

	/**
	 * Get a repertoire item by id.
	 *
	 * @param {Number} id - ID of repertoire item to retrieve
	 *
	 * @returns {Object} Repertoire item object with the following properties:
	 * - id
	 * - name
	 * - composer
	 * - arranger
	 * - genre
	 * - sheetMusicUrl
	 * - description
	 * - dateAdded
	 * - skillLevelId
	 * - teacherId
	 *
	 * @throws {NotFoundError} If repertoire item is not found.
	 */
	static async get(id) {
		const res = await db.query(
			`SELECT r.id, r.name, r.composer, r.arranger, r.genre, r.sheet_music_url AS "sheetMusicUrl", r.description, r.date_added AS "dateAdded",
                    r.teacher_id AS "teacherId", sl.name AS "skillLevel"
            FROM repertoire AS r
            JOIN skill_levels AS sl ON r.skill_level_id = sl.id
            WHERE r.id = $1`,
			[id]
		);

		const repertoire = res.rows[0];

		if (!repertoire)
			throw new NotFoundError(`No repertoire item with id: ${id}`);

		return repertoire;
	}
	/**
	 * Create a new repertoire item and add it to the database.
	 *
	 * @param {object} data - An object containing the new repertoire item's `name`, `composer`, `arranger`, `genre`, `sheetMusicUrl`, `description`, `skillLevelId`, and `teacherId`.
	 *
	 * @returns {object} An object containing the `id`, `name`, `composer`, `arranger`, `genre`, `sheetMusicUrl`, `description`, `dateAdded`, `skillLevel`, and `teacherId` of the newly created repertoire item.
	 *	 */
	static async create({
		name,
		composer,
		arranger,
		genre,
		sheetMusicUrl,
		description,
		skillLevelId,
		teacherId,
	}) {
		try {
			if (!teacherId) throw new BadRequestError("teacherId is required");
			const res = await db.query(
				`
                INSERT INTO repertoire (name, composer, arranger, genre, sheet_music_url, description, skill_level_id, teacher_id)
                VALUES      ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING   id, name, composer, arranger, genre, sheet_music_url AS "sheetMusicUrl", description, date_added AS "dateAdded",
                            (SELECT name FROM skill_levels WHERE id=$7) AS "skillLevel", teacher_id AS "teacherId"`,
				[
					name,
					composer,
					arranger,
					genre,
					sheetMusicUrl,
					description,
					skillLevelId,
					teacherId,
				]
			);
			return res.rows[0];
		} catch (err) {
			handlePostgresError(err);
		}
	}
	/**
	 * Update repertoire with `id` and `data`.
	 *
	 * This is a "partial update" --- it's fine if `data` doesn't contain
	 * all the fields; this only changes provided ones.
	 *
	 * @param {number} id - repertoire item identifier
	 * @param {object} data - can include: {name, composer, arranger, genre, sheetMusicUrl, description, skillLevelId, teacherId}
	 *
	 * @returns {object} - { id, name, composer, arranger, genre, sheetMusicUrl, description, dateAdded, skillLevel, teacherId }
	 *
	 * @throws {NotFoundError} if `id` is invalid
	 */
	static async update(id, data) {
		try {
			const { setCols, values } = sqlForPartialUpdate(data, {
				skillLevelId: "skill_level_id",
				sheetMusicUrl: "sheet_music_url",
				teacherId: "teacher_id",
			});
			const idVarIdx = values.length + 1;

			// Step 1: Update the repertoire item without the skillLevel field
			let querySql = `
            UPDATE repertoire AS r
            SET ${setCols}
            WHERE r.id = $${idVarIdx}
            RETURNING
              r.id,
              r.name,
              r.composer,
              r.arranger,
              r.genre,
              r.sheet_music_url AS "sheetMusicUrl",
              r.description,
              r.date_added AS "dateAdded",
              r.skill_level_id AS "skillLevelId",
              r.teacher_id AS "teacherId"
          `;
			let result = await db.query(querySql, [...values, id]);
			let repertoire = result.rows[0];

			if (!repertoire) {
				throw new NotFoundError(`No repertoire item found with id: ${id}`);
			}

			// Step 2: Query the database again to get the updated repertoire item
			// with the skillLevel field joined from the skill_levels table
			querySql = `
            SELECT
              r.id,
              r.name,
              r.composer,
              r.arranger,
              r.genre,
              r.sheet_music_url AS "sheetMusicUrl",
              r.description,
              r.date_added AS "dateAdded",
              sl.name AS "skillLevel",
              r.teacher_id AS "teacherId"
            FROM
              repertoire AS r
              JOIN skill_levels AS sl ON sl.id = r.skill_level_id
            WHERE r.id = $1
          `;
			result = await db.query(querySql, [id]);
			repertoire = result.rows[0];

			return repertoire;
		} catch (err) {
			handlePostgresError(err);
		}
	}

	/**
	 * Delete the repertoire item with the given id.
	 *
	 * @param {number} id - repertoire item identifier
	 *
	 * @throws {NotFoundError} if `id` is invalid
	 */
	static async delete(id) {
		const result = await db.query(
			`
            DELETE FROM repertoire
            WHERE       id = $1
            RETURNING   id
            `,
			[id]
		);
		const repertoire = result.rows[0];

		if (!repertoire)
			throw new NotFoundError(`No repertoire item found with id: ${id}`);
	}
}

module.exports = Repertoire;
