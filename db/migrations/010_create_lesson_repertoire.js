exports.up = function (knex) {
	return knex.schema.createTable("lesson_repertoire", function (table) {
		table.increments("id").primary();
		table.integer("lesson_id").unsigned().notNullable();
		table.integer("student_repertoire_id").unsigned().notNullable();
		table.boolean("completed").defaultTo(false);
		table.integer("rating").defaultTo(0);
		table.text("notes");
		table
			.foreign("lesson_id")
			.references("id")
			.inTable("lessons")
			.onDelete("CASCADE");
		table
			.foreign("student_repertoire_id")
			.references("id")
			.inTable("student_repertoire")
			.onDelete("CASCADE");
	});
};

exports.down = function (knex) {
	return knex.schema.dropTable("lesson_repertoire");
};
