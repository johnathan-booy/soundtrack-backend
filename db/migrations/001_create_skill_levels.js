exports.up = function (knex) {
	return knex.schema.createTable("skill_levels", function (table) {
		table.increments("id").primary();
		table.string("name").notNullable().unique();
	});
};

exports.down = function (knex) {
	return knex.schema.dropTable("skill_levels");
};
