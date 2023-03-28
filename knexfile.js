module.exports = {
	development: {
		client: "pg",
		connection: {
			database: "soundtrack",
		},
		migrations: {
			directory: "./db/migrations",
		},
		seeds: {
			directory: "./db/seeds",
		},
	},
	test: {
		client: "pg",
		connection: {
			database: "soundtrack_test",
		},
		migrations: {
			directory: "./db/migrations",
		},
		seeds: {
			directory: "./db/seeds",
		},
	},
	production: {
		client: "pg",
		connection: process.env.DATABASE_URL,
		migrations: {
			directory: "./db/migrations",
		},
		seeds: {
			directory: "./db/seeds",
		},
	},
};
