"use strict";
const bcrypt = require("bcrypt");
const db = require("./db/db");
const { BCRYPT_WORK_FACTOR } = require("./config");
const createToken = require("./helpers/createToken.js");
const cleaner = require("knex-cleaner");
const { v4: uuid } = require("uuid");

const testIds = {};

const adminId = uuid();
const teacherId = uuid();

const adminToken = createToken({
	id: adminId,
	isAdmin: true,
});
const teacherToken = createToken({
	id: teacherId,
	isAdmin: false,
});

async function commonBeforeEach() {
	await cleaner.clean(db, {
		mode: "truncate", // reset auto-increment values
		restartIdentity: true,
	});

	// Skill Levels
	const skillLevels = [
		{ name: "Beginner" },
		{ name: "Intermediate" },
		{ name: "Advanced" },
	];
	var results = await db("skill_levels").insert(skillLevels, "id");
	testIds.skillLevels = [...results.map((r) => r.id)];

	const password1 = await bcrypt.hash("password1", BCRYPT_WORK_FACTOR);
	const password2 = await bcrypt.hash("password2", BCRYPT_WORK_FACTOR);

	// Teachers
	const teachers = [
		{
			id: adminId,
			name: "Teacher1",
			email: "teacher1@example.com",
			password: password1,
			description: "This is a description",
			is_admin: true,
		},
		{
			id: teacherId,
			name: "Teacher2",
			email: "teacher2@example.com",
			password: password2,
			description: "This is another description",
			is_admin: false,
		},
	];
	var results = await db("teachers").insert(teachers, "id");
	testIds.teachers = [...results.map((r) => r.id)];

	// Students
	const students = [
		{
			name: "Student1",
			email: "student1@example.com",
			description: "This is a description",
			skill_level_id: testIds.skillLevels[0],
			teacher_id: testIds.teachers[0],
		},
		{
			name: "Student2",
			email: "student2@example.com",
			description: "This is another description",
			skill_level_id: testIds.skillLevels[1],
			teacher_id: testIds.teachers[0],
		},
		{
			name: "Student3",
			email: "student3@example.com",
			description: "This is yet another description",
			skill_level_id: testIds.skillLevels[2],
			teacher_id: testIds.teachers[1],
		},
	];

	var results = await db("students").insert(students, "id");
	testIds.students = [...results.map((r) => r.id)];

	// Techniques
	const techniques = [
		{
			tonic: "C",
			mode: "Ionian",
			type: "Scale",
			description: "This is a scale",
			skill_level_id: testIds.skillLevels[0],
			teacher_id: testIds.teachers[0],
		},
		{
			tonic: "D",
			mode: "Dorian",
			type: "Scale",
			description: "This is another scale",
			skill_level_id: testIds.skillLevels[1],
			teacher_id: testIds.teachers[1],
		},
	];

	var results = await db("techniques").insert(techniques, "id");
	testIds.techniques = [...results.map((r) => r.id)];

	// Repertoire
	const repertoire = [
		{
			name: "Piece1",
			composer: "Composer1",
			arranger: "Arranger1",
			genre: "Classical",
			sheet_music_url: "https://example.com/sheetmusic1",
			description: "This is a piece",
			skill_level_id: testIds.skillLevels[0],
			teacher_id: testIds.teachers[0],
		},
		{
			name: "Piece2",
			composer: "Composer2",
			arranger: null,
			genre: "Pop",
			sheet_music_url: "https://example.com/sheetmusic2",
			description: "This is another piece",
			skill_level_id: testIds.skillLevels[1],
			teacher_id: testIds.teachers[1],
		},
	];

	var results = await db("repertoire").insert(repertoire, "id");
	testIds.repertoire = [...results.map((r) => r.id)];

	// // Student Techniques
	// results = await db.query(`
	// INSERT INTO student_techniques (student_id, technique_id, completed_at, reviewed_at, review_interval)
	// VALUES (${testIds.students[0]}, ${testIds.techniques[0]}, NULL, NOW(), '1 week'),
	//        (${testIds.students[0]}, ${testIds.techniques[1]}, NOW(), NOW(), NULL),
	//        (${testIds.students[1]}, ${testIds.techniques[1]}, NOW(), NOW(), '1 month')
	// RETURNING id`);
	// testIds.studentTechniques = [...results.rows.map((r) => r.id)];

	// // Student Repertoire
	// results = await db.query(`
	// INSERT INTO student_repertoire (student_id, repertoire_id, completed_at, reviewed_at, review_interval)
	// VALUES (${testIds.students[0]}, ${testIds.repertoire[0]}, NULL, NOW(), '1 week'),
	//        (${testIds.students[0]}, ${testIds.repertoire[1]}, NOW(), NOW(), NULL),
	//        (${testIds.students[1]}, ${testIds.repertoire[1]}, NOW(), NOW(), '1 month')
	// RETURNING id`);
	// testIds.studentRepertoire = [...results.rows.map((r) => r.id)];

	// Lessons
	const lessons = [
		{
			student_id: testIds.students[0],
			teacher_id: testIds.teachers[0],
			date: new Date(),
			notes: "This is a note",
		},
		{
			student_id: testIds.students[1],
			teacher_id: testIds.teachers[0],
			date: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
			notes: "This is another note",
		},
		{
			student_id: testIds.students[2],
			teacher_id: testIds.teachers[1],
			date: new Date(),
			notes: "This is yet another note",
		},
		{
			student_id: testIds.students[0],
			teacher_id: testIds.teachers[1],
			date: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
			notes: "This is the last note",
		},
	];

	var results = await db("lessons").insert(lessons, "id");
	testIds.lessons = [...results.map((r) => r.id)];
}

async function commonAfterAll() {
	await db.destroy();
}

module.exports = {
	testIds,
	adminToken,
	teacherToken,
	adminId,
	teacherId,
	commonBeforeEach,
	commonAfterAll,
};
