const SkillLevel = require("./models/skillLevel");
const Teacher = require("./models/teacher");
const Student = require("./models/student");
const db = require("./db");
require("colors");

async function createAll() {
	try {
		console.log();
		console.log();
		const skillLevels = await createSkillLevels();
		const teachers = await createTeachers();
		const students = await createStudents(skillLevels, teachers);
		console.log("Database seeded.".green);
	} catch (error) {
		console.error("Error seeding the database:".red, error);
		process.exit(1);
	} finally {
		db.end();
	}
}

async function createSkillLevels() {
	const skillLevels = await Promise.all([
		SkillLevel.create("Beginner 1"),
		SkillLevel.create("Beginner 2"),
		SkillLevel.create("Beginner 3"),
		SkillLevel.create("Intermediate 1"),
		SkillLevel.create("Intermediate 2"),
		SkillLevel.create("Intermediate 3"),
		SkillLevel.create("Advanced 1"),
		SkillLevel.create("Advanced 2"),
		SkillLevel.create("Advanced 3"),
	]);

	return skillLevels;
}

async function createTeachers() {
	const teachers = await Promise.all([
		Teacher.register({
			email: "johndoe@example.com",
			password: "password",
			name: "John Doe",
			description:
				"Experienced piano teacher with over 10 years of teaching experience.",
			isAdmin: true,
		}),
		Teacher.register({
			email: "janesmith@example.com",
			password: "password",
			name: "Jane Smith",
			description: "Professional violinist and music teacher.",
			isAdmin: false,
		}),
		Teacher.register({
			email: "davidlee@example.com",
			password: "password",
			name: "David Lee",
			description: "Experienced guitar teacher and session musician.",
			isAdmin: false,
		}),
	]);

	return teachers;
}

async function createStudents(skillLevels, teachers) {
	const students = await Promise.all([
		Student.create({
			name: "Alice Johnson",
			email: "alice@example.com",
			teacherId: teachers[0].id,
			description:
				"A 14-year-old beginner piano player who wants to learn classical music.",
			skillLevelId: skillLevels[0].id,
		}),
		Student.create({
			name: "Bob Lee",
			email: "bob@example.com",
			teacherId: teachers[2].id,
			description:
				"A 27-year-old intermediate guitar player who wants to improve his fingerpicking technique.",
			skillLevelId: skillLevels[1].id,
		}),
		Student.create({
			name: "Catherine Kim",
			email: "catherine@example.com",
			teacherId: teachers[1].id,
			description:
				"A 20-year-old advanced violinist who wants to prepare for a music competition.",
			skillLevelId: skillLevels[2].id,
		}),
		Student.create({
			name: "Daniel Park",
			email: "daniel@example.com",
			teacherId: teachers[1].id,
			description:
				"A 10-year-old beginner violin player who is interested in learning different styles of music.",
			skillLevelId: skillLevels[0].id,
		}),
		Student.create({
			name: "Emily Chen",
			email: "emily@example.com",
			teacherId: teachers[0].id,
			description:
				"A 15-year-old intermediate piano player who wants to learn jazz improvisation.",
			skillLevelId: skillLevels[1].id,
		}),
		Student.create({
			name: "Frank Brown",
			email: "frank@example.com",
			teacherId: teachers[2].id,
			description:
				"A 25-year-old advanced guitar player who wants to learn how to write his own music.",
			skillLevelId: skillLevels[2].id,
		}),
		Student.create({
			name: "Grace Davis",
			email: "grace@example.com",
			teacherId: teachers[0].id,
			description:
				"A 12-year-old beginner piano player who is interested in playing pop music.",
			skillLevelId: skillLevels[0].id,
		}),
		Student.create({
			name: "Henry Kim",
			email: "henry@example.com",
			teacherId: teachers[1].id,
			description:
				"A 30-year-old intermediate violin player who wants to improve his bowing technique.",
			skillLevelId: skillLevels[1].id,
		}),
		Student.create({
			name: "Isabella Hernandez",
			email: "isabella@example.com",
			teacherId: teachers[0].id,
			description:
				"A 17-year-old advanced piano player who wants to prepare for a music college audition.",
			skillLevelId: skillLevels[2].id,
		}),
		Student.create({
			name: "Jack Smith",
			email: "jack@example.com",
			teacherId: teachers[2].id,
			description:
				"A 9-year-old beginner guitar player who wants to learn how to play his favorite songs.",
			skillLevelId: skillLevels[0].id,
		}),
	]);
}

createAll();
