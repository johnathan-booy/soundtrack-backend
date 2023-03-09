"use strict";

const { JsonWebTokenError } = require("jsonwebtoken");
const request = require("supertest");

const app = require("../app");
const { SECRET_KEY } = require("../config");

const {
	adminToken,
	teacherToken,
	adminId,
	teacherId,
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	testIds,
} = require("../_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("POST /teachers", () => {
	async function sendRequest(endpoint, authToken, data) {
		return await request(app)
			.post(endpoint)
			.set("Authorization", `Bearer ${authToken}`)
			.send(data);
	}
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
		const resp = await sendRequest("/teachers", teacherToken, data);

		expect(resp.statusCode).toEqual(401);
	});
});

describe("GET /teachers", () => {
	it("works for admin", async () => {
		const resp = await request(app)
			.get("/teachers")
			.set("Authorization", `Bearer ${adminToken}`);

		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			teachers: [
				{
					id: adminId,
					email: "teacher1@example.com",
					name: "Teacher1",
					description: "This is a description",
					isAdmin: true,
				},
				{
					id: teacherId,
					email: "teacher2@example.com",
					name: "Teacher2",
					description: "This is another description",
					isAdmin: false,
				},
			],
		});
	});

	it("returns unauthorized for non-admin user", async () => {
		const resp = await request(app)
			.get("/teachers")
			.set("Authorization", `Bearer ${teacherToken}`);

		expect(resp.statusCode).toEqual(401);
	});
});

describe("GET /teachers/:id", () => {
	it("works for admin", async () => {
		const resp = await request(app)
			.get(`/teachers/${teacherId}`)
			.set("Authorization", `Bearer ${adminToken}`);

		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			teacher: {
				id: teacherId,
				email: "teacher2@example.com",
				name: "Teacher2",
				description: "This is another description",
				isAdmin: false,
			},
		});
	});

	it("works for same teacher as id", async () => {
		const resp = await request(app)
			.get(`/teachers/${teacherId}`)
			.set("Authorization", `Bearer ${teacherToken}`);

		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			teacher: {
				id: teacherId,
				email: "teacher2@example.com",
				name: "Teacher2",
				description: "This is another description",
				isAdmin: false,
			},
		});
	});

	it("returns unauthorized for different teacher than id", async () => {
		const resp = await request(app)
			.get(`/teachers/${adminId}`)
			.set("Authorization", `Bearer ${teacherToken}`);

		expect(resp.statusCode).toEqual(401);
	});
});

describe("PATCH /teachers/:id", () => {
	it("works for admin", async () => {
		const data = {
			email: "update@test.com",
			password: "password",
			name: "updatedUser",
			description: "updated description",
			isAdmin: true,
		};
		const resp = await request(app)
			.patch(`/teachers/${teacherId}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send(data);

		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			teacher: {
				id: teacherId,
				email: "update@test.com",
				name: "updatedUser",
				description: "updated description",
				isAdmin: true,
			},
		});
	});

	it("works for same teacher as id", async () => {
		const data = {
			email: "update@test.com",
		};
		const resp = await request(app)
			.patch(`/teachers/${teacherId}`)
			.set("Authorization", `Bearer ${teacherToken}`)
			.send(data);

		expect(resp.statusCode).toEqual(200);
		expect(resp.body.teacher.email).toEqual("update@test.com");
	});

	it("returns bad request with invalid data", async () => {
		const data = {
			email: "NOT_AN_EMAIL",
		};
		const resp = await request(app)
			.patch(`/teachers/${teacherId}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send(data);

		expect(resp.statusCode).toEqual(400);
	});

	it("returns bad request with duplicate email address", async () => {
		const data = {
			email: "teacher2@example.com",
		};
		const resp = await request(app)
			.patch(`/teachers/${adminId}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send(data);

		expect(resp.statusCode).toEqual(400);
	});

	it("returns unauthorized for different teacher than id", async () => {
		const data = {
			email: "test@test.com",
		};
		const resp = await request(app)
			.patch(`/teachers/${adminId}`)
			.set("Authorization", `Bearer ${teacherToken}`)
			.send(data);

		expect(resp.statusCode).toEqual(401);
	});
});

describe("DELETE /teachers/:id", () => {
	it("works for admin", async () => {
		const resp = await request(app)
			.delete(`/teachers/${teacherId}`)
			.set("Authorization", `Bearer ${adminToken}`);

		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			deleted: teacherId,
		});
	});

	it("works for same teacher as id", async () => {
		const resp = await request(app)
			.delete(`/teachers/${teacherId}`)
			.set("Authorization", `Bearer ${teacherToken}`);

		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			deleted: teacherId,
		});
	});

	it("returns unauthorized for different teacher than id", async () => {
		const resp = await request(app)
			.delete(`/teachers/${adminId}`)
			.set("Authorization", `Bearer ${teacherToken}`);

		expect(resp.statusCode).toEqual(401);
	});
});

describe("GET /teachers/:id/lessons", () => {
	it("works for admin", async () => {
		const resp = await request(app)
			.get(`/teachers/${teacherId}/lessons`)
			.set("Authorization", `Bearer ${adminToken}`);

		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			lessons: [
				{
					id: testIds.lessons[2],
					studentName: "Student3",
					date: expect.any(String),
				},
			],
		});
	});

	it("works for same teacher as id", async () => {
		const resp = await request(app)
			.get(`/teachers/${teacherId}/lessons`)
			.set("Authorization", `Bearer ${teacherToken}`);

		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			lessons: [
				{
					id: testIds.lessons[2],
					studentName: "Student3",
					date: expect.any(String),
				},
			],
		});
	});

	it("filters daysAgo", async () => {
		const resp = await request(app)
			.get(`/teachers/${adminId}/lessons`)
			.set("Authorization", `Bearer ${adminToken}`)
			.query({ daysAgo: 60 });

		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			lessons: [
				{
					id: expect.any(Number),
					studentName: "Student1",
					date: expect.any(String),
				},
				{
					id: expect.any(Number),
					studentName: "Student2",
					date: expect.any(String),
				},
			],
		});
	});

	it("returns unauthorized for different teacher than id", async () => {
		const resp = await request(app)
			.get(`/teachers/${adminId}/lessons`)
			.set("Authorization", `Bearer ${teacherToken}`);

		expect(resp.statusCode).toEqual(401);
	});
});

describe("GET /teachers/:id/techniques", () => {
	it("works for admin", async () => {
		const resp = await request(app)
			.get(`/teachers/${teacherId}/techniques`)
			.set("Authorization", `Bearer ${adminToken}`);

		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			techniques: [
				{
					id: testIds.techniques[1],
					tonic: "D",
					mode: "Dorian",
					type: "Scale",
					description: "This is another scale",
					dateAdded: expect.any(String),
					skillLevel: "Intermediate",
				},
			],
		});
	});

	it("works for same teacher as id", async () => {
		const resp = await request(app)
			.get(`/teachers/${teacherId}/techniques`)
			.set("Authorization", `Bearer ${teacherToken}`);

		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			techniques: [
				{
					id: testIds.techniques[1],
					tonic: "D",
					mode: "Dorian",
					type: "Scale",
					description: "This is another scale",
					dateAdded: expect.any(String),
					skillLevel: "Intermediate",
				},
			],
		});
	});

	it("returns unauthorized for different teacher than id", async () => {
		const resp = await request(app)
			.get(`/teachers/${adminId}/techniques`)
			.set("Authorization", `Bearer ${teacherToken}`);

		expect(resp.statusCode).toEqual(401);
	});
});

describe("GET /teachers/:id/repertoire", () => {
	it("works for admin", async () => {
		const resp = await request(app)
			.get(`/teachers/${teacherId}/repertoire`)
			.set("Authorization", `Bearer ${adminToken}`);

		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			repertoire: [
				{
					id: testIds.repertoire[1],
					name: "Piece2",
					composer: "Composer2",
					arranger: null,
					genre: "Pop",
					sheetMusicUrl: "https://example.com/sheetmusic2",
					description: "This is another piece",
					dateAdded: expect.any(String),
					skillLevel: "Intermediate",
				},
			],
		});
	});

	it("works for same teacher as id", async () => {
		const resp = await request(app)
			.get(`/teachers/${teacherId}/repertoire`)
			.set("Authorization", `Bearer ${teacherToken}`);

		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			repertoire: [
				{
					id: testIds.repertoire[1],
					name: "Piece2",
					composer: "Composer2",
					arranger: null,
					genre: "Pop",
					sheetMusicUrl: "https://example.com/sheetmusic2",
					description: "This is another piece",
					dateAdded: expect.any(String),
					skillLevel: "Intermediate",
				},
			],
		});
	});

	it("returns unauthorized for different teacher than id", async () => {
		const resp = await request(app)
			.get(`/teachers/${adminId}/repertoire`)
			.set("Authorization", `Bearer ${teacherToken}`);

		expect(resp.statusCode).toEqual(401);
	});
});
