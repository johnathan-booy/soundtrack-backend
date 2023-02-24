const db = require("../db");
const { BadRequestError, UnauthorizedError } = require("../expressError");
const Teacher = require("./teacher");
const {
	commonAfterAll,
	commonAfterEach,
	commonBeforeAll,
	commonBeforeEach,
} = require("./_testCommon");

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
			isAdmin: false,
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
