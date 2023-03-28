const snakecaseKeys = require("snakecase-keys");
const db = require("../db/db");
const { NotFoundError, BadRequestError } = require("../expressError");
const handlePostgresError = require("../helpers/handlePostgresError");
const { repertoireCols } = require("./_columns");

class Repertoire {
	/**
	 * Retrieve all repertoire items in the database.
	 *
	 * @returns {Array} [{id, name, composer, arranger, genre, sheetMusicUrl, description, dateAdded, skillLevelId, teacherId}]
	 */
	static async getAll() {
		const results = await db("repertoire")
			.select(repertoireCols)
			.orderBy("name");

		return results;
	}

	/**
	 * Get a repertoire item by id.
	 *
	 * @param {Number} id - ID of repertoire item to retrieve
	 *
	 * @returns {Object} {id, name, composer, arranger, genre, sheetMusicUrl, description, dateAdded, teacherId, skillLevelId}
	 *
	 * @throws {NotFoundError} If repertoire item is not found.
	 */
	static async get(id) {
		const [repertoire] = await db("repertoire")
			.select(repertoireCols)
			.where({ id });

		if (!repertoire)
			throw new NotFoundError(`No repertoire item with id: ${id}`);

		return repertoire;
	}
	/**
	 * Create a new repertoire item and add it to the database.
	 *
	 * @param {object} data {id, name, composer, arranger, genre, sheetMusicUrl, description, dateAdded, teacherId, skillLevelId}
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

			const [repertoire] = await db("repertoire")
				.insert({
					name,
					composer,
					arranger,
					genre,
					sheet_music_url: sheetMusicUrl,
					description,
					skill_level_id: skillLevelId,
					teacher_id: teacherId,
				})
				.returning(repertoireCols);

			return repertoire;
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
	 * @returns {object} - { id, name, composer, arranger, genre, sheetMusicUrl, description, dateAdded, skillLevelId, teacherId }
	 *
	 * @throws {NotFoundError} if `id` is invalid
	 */
	static async update(id, data) {
		try {
			const snakeCaseData = snakecaseKeys(data, { deep: true });
			const [repertoire] = await db("repertoire")
				.where({ id })
				.update(snakeCaseData)
				.returning(repertoireCols);

			if (!repertoire) {
				throw new NotFoundError(`No repertoire item found with id: ${id}`);
			}

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
		const [repertoire] = await db("repertoire").where({ id }).del(["id"]);

		if (!repertoire)
			throw new NotFoundError(`No repertoire item found with id: ${id}`);
	}
}

module.exports = Repertoire;
