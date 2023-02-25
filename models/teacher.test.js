const db = require("../db");
const {
	BadRequestError,
	UnauthorizedError,
	NotFoundError,
} = require("../expressError");
const { update } = require("./teacher");
const Teacher = require("./teacher");
const {
	testIds,
	commonAfterAll,
	commonAfterEach,
	commonBeforeAll,
	commonBeforeEach,
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
