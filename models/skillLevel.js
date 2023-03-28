const db = require("../db/db");
const { NotFoundError } = require("../expressError");
const handlePostgresError = require("../helpers/handlePostgresError");
const { skillLevelCols } = require("./_columns");

class SkillLevel {
	/** Create a new skill level with the given name. Returns the new skill level object.
	 *
	 * @throws {BadRequestError} If the `name` already exists
	 */
	static async create(name) {
		try {
			const [result] = await db("skill_levels")
				.insert({ name })
				.returning(skillLevelCols);
			return result;
		} catch (err) {
			handlePostgresError(err);
		}
	}

	/** Retrieve a skill level by ID. Returns the skill level object.
	 *
	 * @throws {NotFoundError} If no skillLevel is found with the given id.
	 */
	static async get(id) {
		const [skillLevel] = await db("skill_levels")
			.where({ id })
			.select(skillLevelCols);

		if (!skillLevel)
			throw new NotFoundError(`No skillLevel found with id: ${id}`);
		return skillLevel;
	}

	/** Retrieve all skill levels. Returns an array of skill level objects. */
	static async getAll() {
		const result = await db("skill_levels")
			.select(skillLevelCols)
			.orderBy("id");
		return result;
	}

	/** Delete the skill level with the given ID. Returns undefined */
	static async delete(id) {
		const [skillLevel] = await db("skill_levels")
			.where({ id })
			.delete(skillLevelCols)
			.returning("*");
		if (!skillLevel)
			throw new NotFoundError(`No skillLevel found with id: ${id}`);
	}
}

module.exports = SkillLevel;
