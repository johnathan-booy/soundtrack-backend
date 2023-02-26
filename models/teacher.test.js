const db = require("../db");
const {
	BadRequestError,
	UnauthorizedError,
	NotFoundError,
} = require("../expressError");
const Teacher = require("./teacher");
const {
	testIds,
	commonAfterAll,
	commonAfterEach,
	commonBeforeAll,
	commonBeforeEach,
	adminId,
} = require("../_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

// Authenticate a teacher
describe("authenticate", () => {
	it("works", async () => {
		const teacher1 = await Teacher.authenticate(
			"teacher1@example.com",
			"password1"
		);
		const teacher2 = await Teacher.authenticate(
			"teacher2@example.com",
			"password2"
		);
		expect(teacher1).toEqual({
			id: expect.any(String),
			name: "Teacher1",
			email: "teacher1@example.com",
			description: "This is a description",
			isAdmin: true,
		});
		expect(teacher2).toEqual({
			id: expect.any(String),
			name: "Teacher2",
			email: "teacher2@example.com",
			description: "This is another description",
			isAdmin: false,
		});
	});
	it("throws unauth if no such email", async () => {
		try {
			await Teacher.authenticate("wrong", "password1");
			fail();
		} catch (err) {
			expect(err instanceof UnauthorizedError).toBeTruthy();
		}
	});
	it("throws unauth if password is wrong", async () => {
		try {
			await Teacher.authenticate("teacher1@example.com", "wrong");
			fail();
		} catch (err) {
			expect(err instanceof UnauthorizedError).toBeTruthy();
		}
	});
});

// Register a teacher
describe("register", () => {
	const newTeacher = {
		name: "testuser",
		email: "test@test.com",
		description: "test description",
		isAdmin: true,
	};
	it("works", async () => {
		let teacher = await Teacher.register({
			...newTeacher,
			password: "password",
		});
		expect(teacher).toEqual({ ...newTeacher, id: expect.any(String) });

		const found = await db.query(
			"SELECT * FROM teachers WHERE name = 'testuser'"
		);
		expect(found.rows.length).toEqual(1);
		expect(found.rows[0].email).toEqual("test@test.com");
		expect(found.rows[0].description).toEqual("test description");
		expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
		expect(found.rows[0].is_admin).toEqual(true);
	});

	it("throws a bad request with duplicate email", async () => {
		try {
			await Teacher.register({
				...newTeacher,
				password: "password",
			});
			await Teacher.register({
				...newTeacher,
				password: "password",
			});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

// Find all teachers
describe("findAll", () => {
	it("works", async () => {
		const teachers = await Teacher.getAll();
		expect(teachers).toEqual([
			{
				id: testIds.teachers[0],
				name: "Teacher1",
				email: "teacher1@example.com",
				description: "This is a description",
				isAdmin: true,
			},
			{
				id: testIds.teachers[1],
				name: "Teacher2",
				email: "teacher2@example.com",
				description: "This is another description",
				isAdmin: false,
			},
		]);
	});
});

// Get a teacher by id
describe("get", () => {
	it("works", async () => {
		const teachers = await Teacher.get(testIds.teachers[0]);
		expect(teachers).toEqual({
			id: testIds.teachers[0],
			name: "Teacher1",
			email: "teacher1@example.com",
			description: "This is a description",
			isAdmin: true,
		});
	});
	it("throws NotFoundError if teacher id not found", async () => {
		try {
			await Teacher.get(-1); // Nonexistent teacher id
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

// Update a teacher's information
describe("update", () => {
	const updateData = {
		name: "Instructor1",
		email: "instructor1@example.com",
		description: "This is still a description",
		isAdmin: true,
	};

	it("works", async () => {
		const teachers = await Teacher.update(testIds.teachers[0], updateData);
		expect(teachers).toEqual({
			id: testIds.teachers[0],
			...updateData,
		});
	});

	it("works with password", async () => {
		const teachers = await Teacher.update(testIds.teachers[0], {
			password: "newPassword",
		});
		expect(teachers).toEqual({
			id: testIds.teachers[0],
			name: "Teacher1",
			email: "teacher1@example.com",
			description: "This is a description",
			isAdmin: true,
		});

		const found = await db.query(
			`SELECT password FROM teachers WHERE id = '${testIds.teachers[0]}'`
		);
		expect(found.rows.length).toEqual(1);
		expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
	});

	it("throws NotFoundError if teacher id not found", async () => {
		try {
			await Teacher.get(-1); // Nonexistent teacher id
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

// Delete a given teacher
describe("delete", () => {
	it("works", async () => {
		await Teacher.delete(testIds.teachers[0]);

		const deletedTeacher = await db.query(
			`SELECT * FROM teachers WHERE id = $1`,
			[testIds.teachers[0]]
		);

		expect(deletedTeacher.rows.length).toBe(0);
	});

	it("throws NotFoundError if teacher not found", async () => {
		try {
			await Teacher.delete(-1); // Nonexistent teacher id
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

// Get all students assigned to a teacher
describe("getStudents", () => {
	it("works: no filters", async () => {
		const students = await Teacher.getStudents(adminId);
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
		const students = await Teacher.getStudents(adminId, { name: "Student2" });
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
		const students = await Teacher.getStudents(adminId, {
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
	it("filters by name and skill level id", async () => {
		const students = await Teacher.getStudents(adminId, {
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
			await Teacher.getStudents(-1); // Nonexistent teacher id
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

// Get all lessons taught by a student
describe("getLessons", () => {
	// Object for current lesson
	const lessonNow = {
		id: expect.any(Number),
		studentName: "Student1",
		date: expect.any(Date),
	};

	// Object for past lesson (More than 30 days ago)
	const lessonPast = {
		id: expect.any(Number),
		studentName: "Student2",
		date: expect.any(Date),
	};

	it("works: defaults to last 30 days", async () => {
		const lessons = await Teacher.getLessons(adminId);
		expect(lessons).toEqual([lessonNow]);
	});

	it("filters by daysAgo", async () => {
		const lessons = await Teacher.getLessons(adminId, { daysAgo: 60 });
		expect(lessons).toEqual([lessonNow, lessonPast]);
	});
	it("throws NotFoundError if teacher not found", async () => {
		try {
			await Teacher.getLessons(-1); // Nonexistent teacher id
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

// Get all repertoire that were created by a teacher
describe("getTechniques", () => {
	it("works", async () => {
		const techniques = await Teacher.getTechniques(adminId);
		expect(techniques).toEqual([
			{
				id: expect.any(Number),
				tonic: "C",
				mode: "Ionian",
				type: "Scale",
				description: "This is a scale",
				dateAdded: expect.any(Date),
				skillLevel: "Beginner",
			},
		]);
	});
	it("throws NotFoundError if teacher not found", async () => {
		try {
			await Teacher.getTechniques(-1); // Nonexistent teacher id
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

// Get all repertoire that were created by a teacher
describe("getRepertoire", () => {
	it("works", async () => {
		const repertoire = await Teacher.getRepertoire(adminId);
		expect(repertoire).toEqual([
			{
				id: expect.any(Number),
				name: "Piece1",
				composer: "Composer1",
				arranger: "Arranger1",
				genre: "Classical",
				sheetMusicUrl: "https://example.com/sheetmusic1",
				description: "This is a piece",
				dateAdded: expect.any(Date),
				skillLevel: "Beginner",
			},
		]);
	});
	it("throws NotFoundError if teacher not found", async () => {
		try {
			await Teacher.getRepertoire(-1); // Nonexistent teacher id
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});
