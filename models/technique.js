const snakecaseKeys = require("snakecase-keys");
const db = require("../db/db");
const { NotFoundError, BadRequestError } = require("../expressError");
const handlePostgresError = require("../helpers/handlePostgresError");
const { techniqueCols } = require("./_columns");

class Technique {
	/**
	 * Retrieve all techniques in the database.
	 *
	 * @returns {Array} An array of techniques [{id, tonic, mode, type, description, skillLevelId, dateAdded, teacherId}]
	 */
	static async getAll() {
		const results = await db("techniques")
			.select(techniqueCols)
			.orderBy("date_added");
		return results;
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
		const [technique] = await db("techniques")
			.select(techniqueCols)
			.where({ id });

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

			const [technique] = await db("techniques")
				.insert({
					tonic,
					mode,
					type,
					description,
					skill_level_id: skillLevelId,
					teacher_id: teacherId,
				})
				.returning(techniqueCols);

			return technique;
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
			const snakeCaseData = snakecaseKeys(data, { deep: true });
			const [technique] = await db("techniques")
				.where({ id })
				.update(snakeCaseData)
				.returning(techniqueCols);

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
		const [technique] = await db("techniques").where({ id }).del(["id"]);

		if (!technique)
			throw new NotFoundError(`No technique found with id: ${id}`);
	}
}

module.exports = Technique;
