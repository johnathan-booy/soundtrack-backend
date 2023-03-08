const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
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
	it("works: no filters", async () => {
		const students = await Student.getAll();
		expect(students).toEqual([
			{
				id: testIds.students[0],
				name: "Student1",
				email: "student1@example.com",
				description: "This is a description",
				skillLevel: "Beginner",
			},
			{
				id: testIds.students[1],
				name: "Student2",
				email: "student2@example.com",
				description: "This is another description",
				skillLevel: "Intermediate",
			},
			{
				id: testIds.students[2],
				name: "Student3",
				email: "student3@example.com",
				description: "This is yet another description",
				skillLevel: "Advanced",
			},
		]);
	});
	it("filters by teacherId", async () => {
		const students = await Student.getAll({ teacherId: testIds.teachers[0] });
		expect(students).toEqual([
			{
				id: testIds.students[0],
				name: "Student1",
				email: "student1@example.com",
				description: "This is a description",
				skillLevel: "Beginner",
			},
			{
				id: testIds.students[1],
				name: "Student2",
				email: "student2@example.com",
				description: "This is another description",
				skillLevel: "Intermediate",
			},
		]);
	});
	it("filters by name", async () => {
		const students = await Student.getAll({ name: "Student2" });
		expect(students).toEqual([
			{
				id: testIds.students[1],
				name: "Student2",
				email: "student2@example.com",
				description: "This is another description",
				skillLevel: "Intermediate",
			},
		]);
	});
	it("filters by skill level id", async () => {
		const students = await Student.getAll({
			skillLevelId: testIds.skillLevels[1],
		});
		expect(students).toEqual([
			{
				id: testIds.students[1],
				name: "Student2",
				email: "student2@example.com",
				description: "This is another description",
				skillLevel: "Intermediate",
			},
		]);
	});
	it("filters by all", async () => {
		const students = await Student.getAll({
			teacherId: testIds.teachers[0],
			name: "Student",
			skillLevelId: testIds.skillLevels[1],
		});
		expect(students).toEqual([
			{
				id: testIds.students[1],
				name: "Student2",
				email: "student2@example.com",
				description: "This is another description",
				skillLevel: "Intermediate",
			},
		]);
	});
	it("throws NotFoundError if teacher not found", async () => {
		try {
			await Student.getAll({ teacherId: -1 }); // Nonexistent teacher id
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
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

describe("getTechniques", () => {
	const technique1 = {
		id: expect.any(Number),
		tonic: "C",
		mode: "Ionian",
		type: "Scale",
		completed: false,
		lastReview: expect.any(Date),
		nextReview: expect.any(Date),
	};

	const technique2 = {
		id: expect.any(Number),
		tonic: "D",
		mode: "Dorian",
		type: "Scale",
		completed: true,
		lastReview: expect.any(Date),
		nextReview: null,
	};

	it("works: defaults to exclude completed without next review date", async () => {
		const techniques = await Student.getTechniques(testIds.students[0]);
		expect(techniques).toEqual([technique1]);
	});

	it("includes completed techniques without next review date when includeCompleted is true", async () => {
		const techniques = await Student.getTechniques(testIds.students[0], {
			includeCompleted: true,
		});
		expect(techniques).toEqual([technique1, technique2]);
	});

	it("throws NotFoundError if student not found", async () => {
		try {
			await Student.getTechniques(-1);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

describe("getRepertoire", () => {
	const repertoire1 = {
		id: expect.any(Number),
		name: "Piece1",
		composer: "Composer1",
		arranger: "Arranger1",
		genre: "Classical",
		sheetMusicUrl: "https://example.com/sheetmusic1",
		completed: false,
		lastReview: expect.any(Date),
		nextReview: expect.any(Date),
	};

	const repertoire2 = {
		id: expect.any(Number),
		name: "Piece2",
		composer: "Composer2",
		arranger: null,
		genre: "Pop",
		sheetMusicUrl: "https://example.com/sheetmusic2",
		completed: true,
		lastReview: expect.any(Date),
		nextReview: null,
	};

	it("works: defaults to exclude completed without next review date", async () => {
		const repertoire = await Student.getRepertoire(testIds.students[0]);
		expect(repertoire).toEqual([repertoire1]);
	});

	it("includes completed repertoire without next review date when includeCompleted is true", async () => {
		const repertoire = await Student.getRepertoire(testIds.students[0], {
			includeCompleted: true,
		});
		expect(repertoire).toEqual([repertoire1, repertoire2]);
	});

	it("throws NotFoundError if student not found", async () => {
		try {
			await Student.getRepertoire(-1);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

describe("addTechnique", function () {
	test("works", async function () {
		const techniqueId = testIds.techniques[0];
		const studentId = testIds.students[1];
		const reviewIntervalDays = 7;

		const result = await Student.addTechnique({
			studentId,
			techniqueId,
			reviewIntervalDays,
		});

		expect(result).toEqual({
			id: expect.any(Number),
			dateAdded: expect.any(Date),
			tonic: "C",
			mode: "Ionian",
			type: "Scale",
			description: "This is a scale",
			skillLevel: "Beginner",
			teacherId: testIds.teachers[0],
			completed: false,
			lastReview: null,
			nextReview: expect.any(Date),
		});
	});

	test("bad request if no such student", async function () {
		const techniqueId = testIds.techniques[0];
		const studentId = -1;
		const reviewIntervalDays = 7;

		try {
			await Student.addTechnique({
				studentId,
				techniqueId,
				reviewIntervalDays,
			});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});

	test("bad request if no such technique", async function () {
		const techniqueId = -1;
		const studentId = testIds.students[0];
		const reviewIntervalDays = 7;

		try {
			await Student.addTechnique({
				studentId,
				techniqueId,
				reviewIntervalDays,
			});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});

	test("bad request if review interval is not a number", async function () {
		const techniqueId = testIds.techniques[0];
		const studentId = testIds.students[0];
		const reviewIntervalDays = "not a number";

		try {
			await Student.addTechnique({
				studentId,
				techniqueId,
				reviewIntervalDays,
			});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});

	test("bad request if technique is already assigned to the student", async function () {
		const techniqueId = testIds.techniques[0];
		const studentId = testIds.students[0];
		const reviewIntervalDays = 7;

		try {
			await Student.addTechnique({
				studentId,
				techniqueId,
				reviewIntervalDays,
			});

			// Adding the technique again should throw an error
			await Student.addTechnique({
				studentId,
				techniqueId,
				reviewIntervalDays,
			});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

describe("addRepertoire", function () {
	test("works", async function () {
		const repertoireId = testIds.repertoire[0];
		const studentId = testIds.students[1];
		const reviewIntervalDays = 7;

		const result = await Student.addRepertoire({
			studentId,
			repertoireId,
			reviewIntervalDays,
		});
		expect(result).toEqual({
			id: expect.any(Number),
			dateAdded: expect.any(Date),
			name: "Piece1",
			composer: "Composer1",
			arranger: "Arranger1",
			genre: "Classical",
			sheetMusicUrl: "https://example.com/sheetmusic1",
			description: "This is a piece",
			skillLevel: "Beginner",
			teacherId: testIds.teachers[0],
			completed: false,
			lastReview: null,
			nextReview: expect.any(Date),
		});
	});

	test("bad request if no such student", async function () {
		const repertoireId = testIds.repertoire[0];
		const studentId = -1;
		const reviewIntervalDays = 7;

		try {
			await Student.addRepertoire({
				studentId,
				repertoireId,
				reviewIntervalDays,
			});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});

	test("bad request if no such repertoire", async function () {
		const repertoireId = -1;
		const studentId = testIds.students[0];
		const reviewIntervalDays = 7;

		try {
			await Student.addRepertoire({
				studentId,
				repertoireId,
				reviewIntervalDays,
			});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});

	test("bad request if review interval is not a number", async function () {
		const repertoireId = testIds.repertoire[0];
		const studentId = testIds.students[0];
		const reviewIntervalDays = "not a number";

		try {
			await Student.addRepertoire({
				studentId,
				repertoireId,
				reviewIntervalDays,
			});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});

	test("bad request if repertoire is already assigned to the student", async function () {
		const repertoireId = testIds.repertoire[0];
		const studentId = testIds.students[0];
		const reviewIntervalDays = 7;

		try {
			await Student.addRepertoire({
				studentId,
				repertoireId,
				reviewIntervalDays,
			});

			// Adding the repertoire again should throw an error
			await Student.addRepertoire({
				studentId,
				repertoireId,
				reviewIntervalDays,
			});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

describe("deleteTechnique", () => {
	test("works", async () => {
		await Student.deleteTechnique(testIds.students[0], testIds.techniques[0]);

		const deletedTechnique = await db.query(
			`SELECT * FROM student_techniques WHERE student_id = $1 AND technique_id = $2`,
			[testIds.students[0], testIds.techniques[0]]
		);

		expect(deletedTechnique.rows.length).toBe(0);
	});

	test("throws NotFoundError if technique not assigned to student", async () => {
		try {
			await Student.deleteTechnique(testIds.students[1], testIds.techniques[0]); // Technique not assigned to student
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});

	it("throws NotFoundError if technique not found", async () => {
		try {
			await Student.deleteTechnique(testIds.students[0], -1); // Nonexistent technique id
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});

	it("throws NotFoundError if student not found", async () => {
		try {
			await Student.deleteTechnique(-1, testIds.techniques[0]); // Nonexistent student id
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

describe("deleteRepertoire", () => {
	it("works", async () => {
		await Student.deleteRepertoire(testIds.students[0], testIds.repertoire[0]);

		const deletedRepertoire = await db.query(
			`SELECT * FROM student_repertoire WHERE student_id = $1 AND repertoire_id = $2`,
			[testIds.students[0], testIds.repertoire[0]]
		);

		expect(deletedRepertoire.rows.length).toBe(0);
	});

	test("throws NotFoundError if repertoire not assigned to student", async () => {
		try {
			await Student.deleteRepertoire(
				testIds.students[1],
				testIds.repertoire[0]
			); //Repertoire not assigned to student
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});

	it("throws NotFoundError if repertoire not found", async () => {
		try {
			await Student.deleteRepertoire(testIds.students[0], -1); // Nonexistent repertoire id
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});

	it("throws NotFoundError if student not found", async () => {
		try {
			await Student.deleteRepertoire(-1, testIds.repertoire[0]); // Nonexistent student id
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});
