exports.up = function (knex) {
	return knex.schema.createTable("lesson_techniques", function (table) {
		table.increments("id").primary();
		table.integer("lesson_id").unsigned().notNullable();
		table.integer("student_technique_id").unsigned().notNullable();
		table.integer("rating").defaultTo(0);
		table.text("notes");
		table
			.foreign("lesson_id")
			.references("id")
			.inTable("lessons")
			.onDelete("CASCADE");
		table
			.foreign("student_technique_id")
			.references("id")
			.inTable("student_techniques")
			.onDelete("CASCADE");
	});
};

exports.down = function (knex) {
	return knex.schema.dropTable("lesson_techniques");
};
