"use strict";

const request = require("supertest");

const app = require("../app");

const {
	commonBeforeEach,
	commonAfterAll,
	testIds,
	commonAfterEach,
} = require("../_testCommon");

beforeEach(commonBeforeEach);
afterAll(commonAfterAll);

describe("GET /skill-levels", () => {
	it("works", async () => {
		const resp = await request(app).get("/skill-levels");

		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			skillLevels: [
				{ id: testIds.skillLevels[0], name: "Beginner" },
				{ id: testIds.skillLevels[1], name: "Intermediate" },
				{ id: testIds.skillLevels[2], name: "Advanced" },
			],
		});
	});
});
