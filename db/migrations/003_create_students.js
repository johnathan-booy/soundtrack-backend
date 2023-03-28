exports.up = function (knex) {
	return knex.schema.createTable("students", function (table) {
		table.increments("id").primary();
		table.string("name", 50).notNullable();
		table.string("email").notNullable().unique();
		table.text("description");
		table.integer("skill_level_id").unsigned();
		table.uuid("teacher_id");
		table
			.foreign("skill_level_id")
			.references("id")
			.inTable("skill_levels")
			.onDelete("SET NULL");
		table
			.foreign("teacher_id")
			.references("id")
			.inTable("teachers")
			.onDelete("SET NULL");
	});
};

exports.down = function (knex) {
	return knex.schema.dropTable("students");
};
