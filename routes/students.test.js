"use strict";

const request = require("supertest");

const app = require("../app");

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

describe("GET /students", () => {
	it("admin can request all students", async () => {
		const resp = await request(app)
			.get(`/students`)
			.set("Authorization", `Bearer ${adminToken}`);

		expect(resp.statusCode).toEqual(200);

		expect(resp.body).toEqual({
			students: [
				{
					id: testIds.students[0],
					name: "Student1",
					email: "student1@example.com",
					skillLevelId: testIds.skillLevels[0],
				},
				{
					id: testIds.students[1],
					name: "Student2",
					email: "student2@example.com",
					skillLevelId: testIds.skillLevels[1],
				},
				{
					id: testIds.students[2],
					name: "Student3",
					email: "student3@example.com",
					skillLevelId: testIds.skillLevels[2],
				},
			],
		});
	});

	it("admin can filter by any teacherId", async () => {
		const resp = await request(app)
			.get(`/students`)
			.set("Authorization", `Bearer ${adminToken}`)
			.query({ teacherId: teacherId });

		expect(resp.statusCode).toEqual(200);

		expect(resp.body).toEqual({
			students: [
				{
					id: testIds.students[2],
					name: "Student3",
					email: "student3@example.com",
					skillLevelId: testIds.skillLevels[2],
				},
			],
		});
	});

	it("filters for own teacherId", async () => {
		const resp = await request(app)
			.get(`/students`)
			.set("Authorization", `Bearer ${teacherToken}`)
			.query({ teacherId: teacherId });

		expect(resp.statusCode).toEqual(200);

		expect(resp.body).toEqual({
			students: [
				{
					id: testIds.students[2],
					name: "Student3",
					email: "student3@example.com",
					skillLevelId: testIds.skillLevels[2],
				},
			],
		});
	});

	it("filters by name", async () => {
		const resp = await request(app)
			.get(`/students`)
			.set("Authorization", `Bearer ${adminToken}`)
			.query({ teacherId: adminId, name: "2" });

		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			students: [
				{
					id: testIds.students[1],
					name: "Student2",
					email: "student2@example.com",
					skillLevelId: testIds.skillLevels[1],
				},
			],
		});
	});

	it("filters by skillLevelId", async () => {
		const resp = await request(app)
			.get(`/students`)
			.set("Authorization", `Bearer ${adminToken}`)
			.query({ teacherId: adminId, skillLevelId: testIds.skillLevels[1] });

		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			students: [
				{
					id: testIds.students[1],
					name: "Student2",
					email: "student2@example.com",
					skillLevelId: testIds.skillLevels[1],
				},
			],
		});
	});

	it("returns unauthorized for no teacherId", async () => {
		const resp = await request(app)
			.get(`/students`)
			.set("Authorization", `Bearer ${teacherToken}`);

		expect(resp.statusCode).toEqual(401);
	});

	it("returns unauthorized for different teacherId", async () => {
		const resp = await request(app)
			.get(`/students`)
			.set("Authorization", `Bearer ${teacherToken}`)
			.query({ teacherId: adminId });

		expect(resp.statusCode).toEqual(401);
	});
});

describe("GET /students/:id", () => {
	it("works for admin", async () => {
		const resp = await request(app)
			.get(`/students/${testIds.students[0]}`)
			.set("Authorization", `Bearer ${adminToken}`);

		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			student: {
				id: testIds.students[0],
				email: "student1@example.com",
				name: "Student1",
				description: "This is a description",
				skillLevelId: testIds.skillLevels[0],
				teacherId: adminId,
			},
		});
	});

	it("works for same teacher as teacherId", async () => {
		const resp = await request(app)
			.get(`/students/${testIds.students[2]}`)
			.set("Authorization", `Bearer ${teacherToken}`);

		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			student: {
				id: testIds.students[2],
				email: "student3@example.com",
				name: "Student3",
				description: "This is yet another description",
				skillLevelId: testIds.skillLevels[2],
				teacherId: teacherId,
			},
		});
	});

	it("returns unauthorized for different teacher than teacherId", async () => {
		const resp = await request(app)
			.get(`/students/${testIds.students[0]}`)
			.set("Authorization", `Bearer ${teacherToken}`);

		expect(resp.statusCode).toEqual(401);
	});
});

describe("POST /students", () => {
	it("works for admin", async () => {
		const data = {
			email: "new@test.com",
			name: "newUser",
			description: "new description",
			skillLevelId: testIds.skillLevels[0],
			teacherId: teacherId,
		};
		const resp = await request(app)
			.post(`/students`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send(data);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			student: {
				id: expect.any(Number),
				email: "new@test.com",
				name: "newUser",
				description: "new description",
				teacherId: teacherId,
				skillLevelId: testIds.skillLevels[0],
			},
		});
	});

	it("works for same teacher as id", async () => {
		const data = {
			email: "new@test.com",
			name: "newUser",
			description: "new description",
			skillLevelId: testIds.skillLevels[0],
			teacherId: teacherId,
		};
		const resp = await request(app)
			.post(`/students`)
			.set("Authorization", `Bearer ${teacherToken}`)
			.send(data);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			student: {
				id: expect.any(Number),
				email: "new@test.com",
				name: "newUser",
				description: "new description",
				teacherId: teacherId,
				skillLevelId: testIds.skillLevels[0],
			},
		});
	});

	it("returns bad request with invalid data", async () => {
		const data = {
			email: "NOT_AN_EMAIL",
			name: "newUser",
		};
		const resp = await request(app)
			.post(`/students`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send(data);

		expect(resp.statusCode).toEqual(400);
	});

	it("returns bad request with duplicate email address", async () => {
		const data = {
			email: "student1@example.com",
			name: "newUser",
		};
		const resp = await request(app)
			.post(`/students`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send(data);

		expect(resp.statusCode).toEqual(400);
	});

	it("returns unauthorized for different teacher than id", async () => {
		const data = {
			email: "student1@example.com",
			name: "newUser",
			teacherId: adminId,
		};
		const resp = await request(app)
			.post(`/students`)
			.set("Authorization", `Bearer ${teacherToken}`)
			.send(data);

		expect(resp.statusCode).toEqual(401);
	});
});

describe("PATCH /students/:id", () => {
	it("works for admin", async () => {
		const data = {
			email: "update@test.com",
			name: "updatedUser",
			description: "updated description",
			skillLevelId: testIds.skillLevels[0],
		};
		const resp = await request(app)
			.patch(`/students/${testIds.students[2]}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send(data);
		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			student: {
				id: testIds.students[2],
				email: "update@test.com",
				name: "updatedUser",
				description: "updated description",
				teacherId: expect.any(String),
				skillLevelId: testIds.skillLevels[0],
			},
		});
	});

	it("works for same teacher as id", async () => {
		const data = {
			email: "update@test.com",
		};
		const resp = await request(app)
			.patch(`/students/${testIds.students[2]}`)
			.set("Authorization", `Bearer ${teacherToken}`)
			.send(data);

		expect(resp.statusCode).toEqual(200);
		expect(resp.body.student.email).toEqual("update@test.com");
	});

	it("returns bad request with invalid data", async () => {
		const data = {
			email: "NOT_AN_EMAIL",
		};
		const resp = await request(app)
			.patch(`/students/${testIds.students[0]}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send(data);

		expect(resp.statusCode).toEqual(400);
	});

	it("returns bad request with duplicate email address", async () => {
		const data = {
			email: "student1@example.com",
		};
		const resp = await request(app)
			.patch(`/students/${testIds.students[2]}`)
			.set("Authorization", `Bearer ${teacherToken}`)
			.send(data);

		expect(resp.statusCode).toEqual(400);
	});

	it("returns unauthorized for different teacher than id", async () => {
		const data = {
			email: "test@test.com",
		};
		const resp = await request(app)
			.patch(`/students/${testIds.students[0]}`)
			.set("Authorization", `Bearer ${teacherToken}`)
			.send(data);

		expect(resp.statusCode).toEqual(401);
	});
});
