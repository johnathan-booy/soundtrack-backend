const db = require("../db");
const { NotFoundError } = require("../expressError");

class SkillLevel {
	/** Create a new skill level with the given name. Returns the new skill level object.
	 *
	 * @throws {BadRequestError} If the `name` already exists
	 */
	static async create(name) {
		const result = await db.query(
			`INSERT INTO skill_levels (name) VALUES ($1) RETURNING id, name`,
			[name]
		);
		return result.rows[0];
	}

	/** Retrieve a skill level by ID. Returns the skill level object.
	 *
	 * @throws {NotFoundError} If no skillLevel is found with the given id.
	 */
	static async get(id) {
		const result = await db.query(
			`SELECT id, name FROM skill_levels WHERE id = $1`,
			[id]
		);

		const skillLevel = result.rows[0];
		if (!skillLevel)
			throw new NotFoundError(`No skillLevel found with id: ${id}`);
		return skillLevel;
	}

	/** Retrieve all skill levels. Returns an array of skill level objects. */
	static async getAll() {
		const result = await db.query(
			`SELECT id, name FROM skill_levels ORDER BY id`
		);
		return result.rows;
	}

	/** Delete the skill level with the given ID. Returns undefined */
	static async delete(id) {
		const result = await db.query(
			`DELETE FROM skill_levels WHERE id = $1 RETURNING id, name`,
			[id]
		);
		const skillLevel = result.rows[0];
		if (!skillLevel)
			throw new NotFoundError(`No skillLevel found with id: ${id}`);
	}
}

module.exports = SkillLevel;
