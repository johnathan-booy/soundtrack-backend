"use strict";

const request = require("supertest");

const app = require("../app");

const {
	adminToken,
	teacherToken,
	adminId,
	teacherId,
	commonBeforeEach,
	commonAfterAll,
	testIds,
} = require("../_testCommon");

beforeEach(commonBeforeEach);
afterAll(commonAfterAll);

describe("POST /lessons", () => {
	it("works for admin", async () => {
		const data = {
			studentId: testIds.students[0],
			teacherId: teacherId,
			notes: "This is a new note",
		};
		const resp = await request(app)
			.post(`/lessons`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send(data);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			lesson: {
				id: expect.any(Number),
				date: expect.any(String),
				...data,
			},
		});
	});

	it("works for same teacher as id", async () => {
		const data = {
			studentId: testIds.students[2],
			teacherId: teacherId,
			notes: "This is a new note",
		};
		const resp = await request(app)
			.post(`/lessons`)
			.set("Authorization", `Bearer ${teacherToken}`)
			.send(data);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			lesson: {
				id: expect.any(Number),
				date: expect.any(String),
				...data,
			},
		});
	});

	it("returns bad request with invalid data", async () => {
		const data = {
			teacherId: adminId,
			studentId: 9999999,
		};
		const resp = await request(app)
			.post(`/lessons`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send(data);

		expect(resp.statusCode).toEqual(400);
	});

	it("returns unauthorized for different teacher than teacherId", async () => {
		const data = {
			studentId: testIds.students[2],
			teacherId: adminId,
			notes: "This is a new note",
		};
		const resp = await request(app)
			.post(`/lessons`)
			.set("Authorization", `Bearer ${teacherToken}`)
			.send(data);

		expect(resp.statusCode).toEqual(401);
	});
});

describe("PATCH /lessons/:id", () => {
	it("works for admin", async () => {
		const data = {
			studentId: testIds.students[1],
			teacherId: teacherId,
			notes: "This is an updated note",
			date: "2023-03-11T04:09:47.669Z",
		};
		const resp = await request(app)
			.patch(`/lessons/${testIds.lessons[0]}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send(data);
		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			lesson: {
				id: expect.any(Number),
				studentId: testIds.students[1],
				teacherId: teacherId,
				notes: "This is an updated note",
				date: expect.any(String),
			},
		});
	});

	it("works for same teacher as id", async () => {
		const data = {
			studentId: testIds.students[1],
			teacherId: teacherId,
			notes: "This is an updated note",
		};
		const resp = await request(app)
			.patch(`/lessons/${testIds.lessons[2]}`)
			.set("Authorization", `Bearer ${teacherToken}`)
			.send(data);
		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			lesson: {
				id: expect.any(Number),
				date: expect.any(String),
				...data,
			},
		});
	});

	it("returns bad request with invalid data", async () => {
		const data = {
			teacherId: adminId,
			studentId: 9999999,
		};
		const resp = await request(app)
			.patch(`/lessons/${testIds.lessons[2]}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send(data);

		expect(resp.statusCode).toEqual(400);
	});

	it("returns unauthorized for different teacher than id", async () => {
		const data = {
			studentId: testIds.students[1],
			teacherId: teacherId,
			notes: "This is an updated note",
		};
		const resp = await request(app)
			.patch(`/lessons/${testIds.lessons[0]}`)
			.set("Authorization", `Bearer ${teacherToken}`)
			.send(data);

		expect(resp.statusCode).toEqual(401);
	});
});

describe("DELETE /lessons/:id", () => {
	it("works for admin", async () => {
		const resp = await request(app)
			.delete(`/lessons/${testIds.lessons[2]}`)
			.set("Authorization", `Bearer ${adminToken}`);

		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			deleted: testIds.lessons[2],
		});
	});

	it("works for same teacher as id", async () => {
		const resp = await request(app)
			.delete(`/lessons/${testIds.lessons[2]}`)
			.set("Authorization", `Bearer ${teacherToken}`);

		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			deleted: testIds.lessons[2],
		});
	});

	it("returns unauthorized for different teacher than id", async () => {
		const resp = await request(app)
			.delete(`/lessons/${testIds.lessons[0]}`)
			.set("Authorization", `Bearer ${teacherToken}`);

		expect(resp.statusCode).toEqual(401);
	});
});
