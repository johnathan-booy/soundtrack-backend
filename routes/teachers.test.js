"use strict";

const request = require("supertest");

const app = require("../app");

const {
	testData,
	adminToken,
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("POST /teachers", () => {
	it("works for admin", async () => {
		const resp = await request(app)
			.post("/teachers")
			.set("Authorization", `Bearer ${adminToken}`)
			.send({
				email: "test@test.com",
				password: "password",
				name: "testuser",
				description: "test description",
				isAdmin: true,
			});

		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			teacher: {
				id: expect.any(String),
				email: "test@test.com",
				name: "testuser",
				description: "test description",
				isAdmin: true,
			},
			token: expect.any(String),
		});
	});

	it("returns bad request with missing fields", async () => {
		const resp = await request(app)
			.post("/teachers")
			.set("Authorization", `Bearer ${adminToken}`)
			.send({
				name: "testuser",
			});

		expect(resp.statusCode).toEqual(400);
	});

	it("returns bad request with invalid data", async () => {
		const resp = await request(app)
			.post("/teachers")
			.set("Authorization", `Bearer ${adminToken}`)
			.send({
				email: "NOT_AN_EMAIL",
				password: "password",
				name: "testuser",
				description: "test description",
				isAdmin: true,
			});

		expect(resp.statusCode).toEqual(400);
	});

	it("returns bad request with duplicate email address", async () => {
		await request(app)
			.post("/teachers")
			.set("Authorization", `Bearer ${adminToken}`)
			.send({
				email: "test@test.com",
				password: "password1",
				name: "testuser1",
				description: "test description 1",
				isAdmin: false,
			});
		const resp = await request(app)
			.post("/teachers")
			.set("Authorization", `Bearer ${adminToken}`)
			.send({
				email: "test@test.com",
				password: "password1",
				name: "testuser2",
				description: "test description 2",
				isAdmin: false,
			});
		expect(resp.statusCode).toEqual(400);
	});

	it("returns unauthorized for non-admin user", async () => {
		const resp = await request(app)
			.post("/teachers")
			.set("Authorization", `Bearer ${testData.studentToken}`)
			.send({
				email: "test@test.com",
				password: "password",
				name: "testuser",
				description: "test description",
				isAdmin: true,
			});

		expect(resp.statusCode).toEqual(401);
	});
});
