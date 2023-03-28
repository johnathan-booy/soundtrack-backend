exports.up = function (knex) {
	return knex.schema.createTable("repertoire", function (table) {
		table.increments("id").primary();
		table.text("name").notNullable();
		table.string("composer", 50).notNullable();
		table.string("arranger", 50);
		table.string("genre").notNullable();
		table.string("sheet_music_url");
		table.text("description");
		table.timestamp("date_added").defaultTo(knex.fn.now());
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
	return knex.schema.dropTable("repertoire");
};
