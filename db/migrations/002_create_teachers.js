exports.up = function (knex) {
	return knex.schema.createTable("teachers", function (table) {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
		table.text("password").notNullable();
		table.string("name", 50).notNullable();
		table.string("email").notNullable().unique();
		table.text("description");
		table.timestamp("date_added").defaultTo(knex.fn.now());
		table.boolean("is_admin").notNullable().defaultTo(false);
	});
};

exports.down = function (knex) {
	return knex.schema.dropTable("teachers");
};
