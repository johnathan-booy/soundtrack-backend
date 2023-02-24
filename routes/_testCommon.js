"use strict";

const db = require("../db");
const createToken = require("../helpers/createToken");
const Teacher = require("../models/teacher");

const testData = { teachers: [] };
async function commonBeforeAll() {
	await db.query("DELETE FROM teachers");

	testData.teachers[0] = await Teacher.register({
		name: "Teacher1",
		email: "teacher1@example.com",
		password: "password1",
		description: "This is a description",
		isAdmin: true,
	});

	testData.teachers[1] = await Teacher.register({
		name: "Teacher2",
		email: "teacher2@example.com",
		password: "password2",
		description: "This is another description",
		isAdmin: false,
	});
}

async function commonBeforeEach() {
	await db.query("BEGIN");
}

async function commonAfterEach() {
	await db.query("ROLLBACK");
}

async function commonAfterAll() {
	await db.end();
}

const adminToken = createToken({
	email: "teacher1@example.com",
	isAdmin: true,
});

module.exports = {
	testData,
	adminToken,
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
};
