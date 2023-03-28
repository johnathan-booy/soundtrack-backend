exports.up = function (knex) {
	return knex.schema.createTable("student_repertoire", function (table) {
		table.increments("id").primary();
		table.timestamp("completed_at");
		table.timestamp("reviewed_at");
		table.timestamp("date_added").defaultTo(knex.fn.now());
		table.integer("student_id").unsigned().notNullable();
		table.integer("repertoire_id").unsigned().notNullable();
		table.unique(["student_id", "repertoire_id"]);
		table
			.foreign("student_id")
			.references("id")
			.inTable("students")
			.onDelete("CASCADE");
		table
			.foreign("repertoire_id")
			.references("id")
			.inTable("repertoire")
			.onDelete("CASCADE");
	});
};

exports.down = function (knex) {
	return knex.schema.dropTable("student_repertoire");
};
