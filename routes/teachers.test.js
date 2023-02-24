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

async function sendRequest(endpoint, authToken, data) {
	return await request(app)
		.post(endpoint)
		.set("Authorization", `Bearer ${authToken}`)
		.send(data);
}

describe("POST /teachers", () => {
	it("works for admin", async () => {
		const data = {
			email: "test@test.com",
			password: "password",
			name: "testuser",
			description: "test description",
			isAdmin: true,
		};
		const resp = await sendRequest("/teachers", adminToken, data);

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
		const data = {
			name: "testuser",
		};
		const resp = await sendRequest("/teachers", adminToken, data);

		expect(resp.statusCode).toEqual(400);
	});

	it("returns bad request with invalid data", async () => {
		const data = {
			email: "NOT_AN_EMAIL",
			password: "password",
			name: "testuser",
			description: "test description",
			isAdmin: true,
		};
		const resp = await sendRequest("/teachers", adminToken, data);

		expect(resp.statusCode).toEqual(400);
	});

	it("returns bad request with duplicate email address", async () => {
		const data1 = {
			email: "test@test.com",
			password: "password1",
			name: "testuser1",
			description: "test description 1",
			isAdmin: false,
		};
		const data2 = {
			email: "test@test.com",
			password: "password1",
			name: "testuser2",
			description: "test description 2",
			isAdmin: false,
		};
		await sendRequest("/teachers", adminToken, data1);
		const resp = await sendRequest("/teachers", adminToken, data2);

		expect(resp.statusCode).toEqual(400);
	});

	it("returns unauthorized for non-admin user", async () => {
		const data = {
			email: "test@test.com",
			password: "password",
			name: "testuser",
			description: "test description",
			isAdmin: true,
		};
		const resp = await sendRequest("/teachers", testData.studentToken, data);

		expect(resp.statusCode).toEqual(401);
	});
});
