exports.up = function (knex) {
	return knex.schema.createTable("lessons", function (table) {
		table.increments("id").primary();
		table.integer("student_id").unsigned().notNullable();
		table.uuid("teacher_id");
		table.timestamp("date").defaultTo(knex.fn.now());
		table.text("notes");
		table
			.foreign("student_id")
			.references("id")
			.inTable("students")
			.onDelete("CASCADE");
		table
			.foreign("teacher_id")
			.references("id")
			.inTable("teachers")
			.onDelete("SET NULL");
	});
};

exports.down = function (knex) {
	return knex.schema.dropTable("lessons");
};
