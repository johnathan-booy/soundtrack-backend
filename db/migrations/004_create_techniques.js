exports.up = function (knex) {
	return knex.schema.createTable("techniques", function (table) {
		table.increments("id").primary();
		table.string("tonic", 2).notNullable();
		table.string("mode").notNullable();
		table.string("type").notNullable();
		table.text("description");
		table.timestamp("date_added").defaultTo(knex.fn.now());
		table.integer("skill_level_id").unsigned();
		table.uuid("teacher_id");
		table.unique(["tonic", "mode", "type", "teacher_id"]);
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
	return knex.schema.dropTable("techniques");
};
