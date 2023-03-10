"use strict";

const request = require("supertest");

const app = require("../app");

const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
} = require("../_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("POST /auth/login", () => {
	it("works for existing teacher", async () => {
		const resp = await request(app).post("/auth/login").send({
			email: "teacher1@example.com",
			password: "password1",
		});

		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			token: expect.any(String),
			teacherId: expect.any(String),
		});
	});

	it("returns unauthorized for non-existent teacher", async () => {
		const resp = await request(app).post("/auth/login").send({
			email: "nonexistent@test.com",
			password: "password",
		});

		expect(resp.statusCode).toEqual(401);
	});

	it("returns unauthorized for incorrect password", async () => {
		const resp = await request(app).post("/auth/login").send({
			email: "teacher1@example.com",
			password: "wrongpassword",
		});

		expect(resp.statusCode).toEqual(401);
	});

	it("returns bad request with missing fields", async () => {
		const resp = await request(app).post("/auth/login").send({});

		expect(resp.statusCode).toEqual(400);
	});

	it("returns bad request with invalid data", async () => {
		const resp = await request(app).post("/auth/login").send({
			email: "NOT_AN_EMAIL",
			password: "password",
		});

		expect(resp.statusCode).toEqual(400);
	});
});

describe("POST /auth/register", () => {
	it("works for anon", async () => {
		const resp = await request(app).post("/auth/register").send({
			email: "test@test.com",
			password: "password",
			name: "testuser",
			description: "test description",
		});

		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			token: expect.any(String),
			teacherId: expect.any(String),
		});
	});

	it("returns bad request with missing fields", async () => {
		const resp = await request(app).post("/auth/register").send({
			name: "testuser",
		});

		expect(resp.statusCode).toEqual(400);
	});

	it("returns bad request with invalid data", async () => {
		const resp = await request(app).post("/auth/register").send({
			email: "NOT_AN_EMAIL",
			password: "password",
			name: "testuser",
			description: "test description",
		});

		expect(resp.statusCode).toEqual(400);
	});

	it("returns bad request with duplicate email address", async () => {
		await request(app).post("/auth/register").send({
			email: "test@test.com",
			password: "password1",
			name: "testuser1",
			description: "test description 1",
		});
		const resp = await request(app).post("/auth/register").send({
			email: "test@test.com",
			password: "password1",
			name: "testuser2",
			description: "test description 2",
		});
		expect(resp.statusCode).toEqual(400);
	});
});
