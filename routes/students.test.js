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
					description: "This is yet another description",
					skillLevel: "Advanced",
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
					description: "This is yet another description",
					skillLevel: "Advanced",
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
					description: "This is another description",
					skillLevel: "Intermediate",
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
					description: "This is another description",
					skillLevel: "Intermediate",
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
