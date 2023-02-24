"use strict";
const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");

const testIds = {};
async function commonBeforeAll() {
	await db.query("DELETE FROM student_repertoire");
	await db.query("DELETE FROM student_techniques");
	await db.query("DELETE FROM lesson_repertoire");
	await db.query("DELETE FROM lesson_techniques");
	await db.query("DELETE FROM techniques");
	await db.query("DELETE FROM repertoire");
	await db.query("DELETE FROM lessons");
	await db.query("DELETE FROM students");
	await db.query("DELETE FROM teachers");
	await db.query("DELETE FROM skill_levels");

	// Skill Levels
	let results;
	results = await db.query(
		`
    INSERT INTO skill_levels (name)
    VALUES ('Beginner'), ('Intermediate'), ('Advanced')
    RETURNING id`
	);
	testIds.skillLevels = [...results.rows.map((r) => r.id)];

	const password1 = await bcrypt.hash("password1", BCRYPT_WORK_FACTOR);
	const password2 = await bcrypt.hash("password2", BCRYPT_WORK_FACTOR);

	// Teachers
	results = await db.query(
		`
    INSERT INTO teachers (id, name, email, password, description)
    VALUES (1, 'Teacher1', 'teacher1@example.com', $1, 'This is a description'),
           (2, 'Teacher2', 'teacher2@example.com', $2, 'This is another description')
    RETURNING id`,
		[password1, password2]
	);
	testIds.teachers = [...results.rows.map((r) => r.id)];

	// Students
	results = await db.query(`
    INSERT INTO students (name, email, description, skill_level_id, teacher_id)
    VALUES ('Student1', 'student1@example.com', 'This is a description', ${testIds.skillLevels[0]}, ${testIds.teachers[0]}),
           ('Student2', 'student2@example.com', 'This is another description', ${testIds.skillLevels[1]}, ${testIds.teachers[1]})
    RETURNING id`);
	testIds.students = [...results.rows.map((r) => r.id)];

	// Techniques
	results = await db.query(`
    INSERT INTO techniques (tonic, mode, type, description, skill_level_id, teacher_id)
    VALUES ('C', 'Ionian', 'Scale', 'This is a scale', ${testIds.skillLevels[0]}, ${testIds.teachers[0]}),
           ('D', 'Dorian', 'Scale', 'This is another scale', ${testIds.skillLevels[1]}, ${testIds.teachers[1]})
    RETURNING id`);
	testIds.techniques = [...results.rows.map((r) => r.id)];

	// Repertoire
	results = await db.query(`
    INSERT INTO repertoire (name, composer, arranger, genre, sheet_music_url, description, skill_level_id, teacher_id)
    VALUES ('Piece1', 'Composer1', 'Arranger1', 'Classical', 'https://example.com/sheetmusic1', 'This is a piece', ${testIds.skillLevels[0]}, ${testIds.teachers[0]}),
           ('Piece2', 'Composer2', NULL, 'Pop', 'https://example.com/sheetmusic2', 'This is another piece', ${testIds.skillLevels[1]}, ${testIds.teachers[1]})
    RETURNING id`);
	testIds.repertoire = [...results.rows.map((r) => r.id)];

	// Student Techniques
	results = await db.query(`
    INSERT INTO student_techniques (student_id, technique_id, completed_at, reviewed_at, review_interval)
    VALUES (${testIds.students[0]}, ${testIds.techniques[0]}, NOW(), NOW(), '3 months'),
           (${testIds.students[1]}, ${testIds.techniques[1]}, NOW(), NOW(), '6 months')
    RETURNING id`);
	testIds.studentTechniques = [...results.rows.map((r) => r.id)];

	// Student Repertoire
	results = await db.query(`
    INSERT INTO student_repertoire (student_id, repertoire_id, completed_at, reviewed_at, review_interval)
    VALUES (${testIds.students[0]}, ${testIds.repertoire[0]}, NOW(), NOW(), '1 month'),
           (${testIds.students[1]}, ${testIds.repertoire[1]}, NOW(), NOW(), '2 months')
    RETURNING id`);
	testIds.studentRepertoire = [...results.rows.map((r) => r.id)];

	// Lessons
	results = await db.query(`
    INSERT INTO lessons (student_id, teacher_id, date, notes)
    VALUES (${testIds.students[0]}, ${testIds.teachers[0]}, NOW(), 'This is a note'),
           (${testIds.students[1]}, ${testIds.teachers[1]}, NOW(), 'This is another note')
    RETURNING id`);
	testIds.lessons = [...results.rows.map((r) => r.id)];

	await db.query(`
    INSERT INTO lesson_techniques (lesson_id, student_technique_id, rating, notes)
    VALUES (${testIds.lessons[0]}, ${testIds.studentTechniques[0]}, 3, 'This is a note'),
           (${testIds.lessons[1]}, ${testIds.studentTechniques[1]}, 2, 'This is another note')`);

	await db.query(`
    INSERT INTO lesson_repertoire (lesson_id, student_repertoire_id, completed, rating, notes)
    VALUES (${testIds.lessons[0]}, ${testIds.studentRepertoire[0]}, false, 1, 'This is a note'),
            (${testIds.lessons[1]}, ${testIds.studentRepertoire[1]}, true, 3, 'This is another note')`);
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

module.exports = {
	commonBeforeAll,
	commonAfterAll,
	commonBeforeEach,
	commonAfterEach,
};
