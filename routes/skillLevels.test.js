"use strict";

const request = require("supertest");

const app = require("../app");

const {
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
