const db = require("../db/db");
const {
	BadRequestError,
	UnauthorizedError,
	NotFoundError,
} = require("../expressError");
const Teacher = require("./teacher");
const {
	testIds,
	commonAfterAll,
	commonBeforeEach,
	adminId,
} = require("../_testCommon");

beforeEach(commonBeforeEach);
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

		const rows = await db
			.select("*")
			.from("teachers")
			.where({ name: "testuser" });
		expect(rows.length).toEqual(1);
		expect(rows[0].email).toEqual("test@test.com");
		expect(rows[0].description).toEqual("test description");
		expect(rows[0].password.startsWith("$2b$")).toEqual(true);
		expect(rows[0].is_admin).toEqual(true);
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

// Get all teachers
describe("getAll", () => {
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

		const [found] = await db
			.select("password")
			.from("teachers")
			.where({ id: testIds.teachers[0] });
		expect(found.password.startsWith("$2b$")).toEqual(true);
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

		const results = await db
			.select("*")
			.from("teachers")
			.where({ id: testIds.teachers[0] });

		expect(results.length).toBe(0);
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
				skillLevelId: testIds.skillLevels[0],
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
				skillLevelId: testIds.skillLevels[0],
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
