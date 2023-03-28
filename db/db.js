const knex = require("knex");
const knexConfig = require("../knexfile");

const env = process.env.NODE_ENV || "development";
const config = knexConfig[env];

const db = knex(config);

module.exports = db;
