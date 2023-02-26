const db = require("../db");
const {
	BadRequestError,
	UnauthorizedError,
	NotFoundError,
} = require("../expressError");
const {
	testIds,
	commonAfterAll,
	commonAfterEach,
	commonBeforeAll,
	commonBeforeEach,
	adminId,
} = require("../_testCommon");
const Student = require("./student");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("create", () => {
	const newStudent = {
		name: "teststudent",
		email: "test@test.com",
		description: "test description",
		teacherId: adminId,
	};
	it("works", async () => {
		const student = await Student.create(newStudent);
		expect(student).toEqual({
			...newStudent,
			skillLevelId: null,
			id: expect.any(Number),
		});

		const found = await db.query(
			"SELECT * FROM students WHERE name = 'teststudent'"
		);
		expect(found.rows.length).toEqual(1);
		expect(found.rows[0].email).toEqual("test@test.com");
		expect(found.rows[0].description).toEqual("test description");
		expect(found.rows[0].teacher_id).toEqual(adminId);
		expect(found.rows[0].skill_level_id).toEqual(null);
	});

	it("throws a bad request with duplicate email", async () => {
		try {
			await Student.create(newStudent);
			await Student.create(newStudent);
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});

	it("throws a bad request with invalid teacherId", async () => {
		try {
			await Student.create({ ...newStudent, teacherId: -1 });
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
	it("throws a bad request with invalid skillLevelId", async () => {
		try {
			await Student.create({ ...newStudent, skillLevelId: -1 });
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

describe("getAll", () => {
	it("works", async () => {
		const students = await Student.getAll();
		expect(students).toEqual([
			{
				id: testIds.students[0],
				name: "Student1",
				email: "student1@example.com",
				description: "This is a description",
				skillLevelId: testIds.skillLevels[0],
				teacherId: testIds.teachers[0],
			},
			{
				id: testIds.students[1],
				name: "Student2",
				email: "student2@example.com",
				description: "This is another description",
				skillLevelId: testIds.skillLevels[1],
				teacherId: testIds.teachers[0],
			},
			{
				id: testIds.students[2],
				name: "Student3",
				email: "student3@example.com",
				description: "This is yet another description",
				skillLevelId: testIds.skillLevels[2],
				teacherId: testIds.teachers[1],
			},
		]);
	});
});

describe("get", () => {
	it("works", async () => {
		const student = await Student.get(testIds.students[0]);
		expect(student).toEqual({
			id: testIds.students[0],
			name: "Student1",
			email: "student1@example.com",
			description: "This is a description",
			skillLevelId: testIds.skillLevels[0],
			teacherId: testIds.teachers[0],
		});
	});

	it("throws NotFoundError if student id not found", async () => {
		try {
			await Student.get(-1); // Nonexistent student id
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

describe("update", () => {
	const updateData = {
		name: "New Name",
		email: "new-email@example.com",
		teacherId: adminId,
		description: "This is a new description",
	};

	it("works", async () => {
		const student = await Student.update(testIds.students[0], updateData);
		expect(student).toEqual({
			id: testIds.students[0],
			skillLevelId: testIds.skillLevels[0],
			...updateData,
		});
	});

	it("throws NotFoundError if student id not found", async () => {
		try {
			await Student.update(-1, updateData); // Nonexistent student id
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});

	it("throws BadRequestError if teacher id is invalid", async () => {
		try {
			await Student.update(testIds.students[0], {
				teacherId: -1, // Invalid teacher id
			});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});

	it("throws BadRequestError if skill level id is invalid", async () => {
		try {
			await Student.update(testIds.students[0], {
				skillLevelId: -1, // Invalid skill level id
			});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});

	it("throws BadRequestError if email already exists", async () => {
		try {
			await Student.update(testIds.students[0], {
				email: "student2@example.com", // Duplicate email
			});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

describe("delete", () => {
	it("works", async () => {
		await Student.delete(testIds.students[0]);

		const deletedStudent = await db.query(
			`SELECT * FROM students WHERE id = $1`,
			[testIds.students[0]]
		);

		expect(deletedStudent.rows.length).toBe(0);
	});

	it("throws NotFoundError if student not found", async () => {
		try {
			await Student.delete(-1); // Nonexistent student id
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

describe("getLessons", () => {
	// Object for current lesson
	const lessonNow = {
		id: expect.any(Number),
		teacherName: "Teacher1",
		date: expect.any(Date),
	};

	// Object for past lesson (More than 30 days ago)
	const lessonPast = {
		id: expect.any(Number),
		teacherName: "Teacher2",
		date: expect.any(Date),
	};

	it("works: defaults to last 30 days", async () => {
		const lessons = await Student.getLessons(testIds.students[0]);
		expect(lessons).toEqual([lessonNow]);
	});

	it("filters by daysAgo", async () => {
		const lessons = await Student.getLessons(testIds.students[0], {
			daysAgo: 60,
		});
		expect(lessons).toEqual([lessonNow, lessonPast]);
	});

	it("throws NotFoundError if student not found", async () => {
		try {
			await Student.getLessons(-1); // Nonexistent student id
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

// Get all repertoire that were created by a teacher
// describe("getTechniques", () => {
// 	it("works", async () => {
// 		const techniques = await Teacher.getTechniques(adminId);
// 		expect(techniques).toEqual([
// 			{
// 				id: expect.any(Number),
// 				tonic: "C",
// 				mode: "Ionian",
// 				type: "Scale",
// 				description: "This is a scale",
// 				dateAdded: expect.any(Date),
// 				skillLevel: "Beginner",
// 			},
// 		]);
// 	});
// 	it("throws NotFoundError if teacher not found", async () => {
// 		try {
// 			await Teacher.getTechniques(-1); // Nonexistent teacher id
// 			fail();
// 		} catch (err) {
// 			expect(err instanceof NotFoundError).toBeTruthy();
// 		}
// 	});
// });

// Get all repertoire that were created by a teacher
// describe("getRepertoire", () => {
// 	it("works", async () => {
// 		const repertoire = await Teacher.getRepertoire(adminId);
// 		expect(repertoire).toEqual([
// 			{
// 				id: expect.any(Number),
// 				name: "Piece1",
// 				composer: "Composer1",
// 				arranger: "Arranger1",
// 				genre: "Classical",
// 				sheetMusicUrl: "https://example.com/sheetmusic1",
// 				description: "This is a piece",
// 				dateAdded: expect.any(Date),
// 				skillLevel: "Beginner",
// 			},
// 		]);
// 	});
// 	it("throws NotFoundError if teacher not found", async () => {
// 		try {
// 			await Teacher.getRepertoire(-1); // Nonexistent teacher id
// 			fail();
// 		} catch (err) {
// 			expect(err instanceof NotFoundError).toBeTruthy();
// 		}
// 	});
// });
