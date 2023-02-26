"use strict";

const SkillLevel = require("./SkillLevel");
const db = require("../db");
const {
	commonBeforeAll,
	commonAfterAll,
	commonBeforeEach,
	commonAfterEach,
} = require("../_testCommon");
const { NotFoundError } = require("../expressError");

beforeAll(commonBeforeAll);
afterAll(commonAfterAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);

describe("SkillLevel", function () {
	describe("create", function () {
		test("works", async function () {
			const skillLevel = await SkillLevel.create("New Level");

			expect(skillLevel).toEqual({
				id: expect.any(Number),
				name: "New Level",
			});

			const result = await db.query(
				`SELECT name
           FROM skill_levels
           WHERE name = 'New Level'`
			);
			expect(result.rows).toEqual([{ name: "New Level" }]);
		});

		test("throws error with duplicate", async function () {
			try {
				await SkillLevel.create("Beginner");
				fail();
			} catch (err) {
				expect(err).toBeTruthy();
			}
		});
	});

	describe("get", function () {
		test("works", async function () {
			const skillLevel = await SkillLevel.create("New Level");
			const level = await SkillLevel.get(skillLevel.id);

			expect(level).toEqual({
				id: expect.any(Number),
				name: "New Level",
			});
		});

		test("not found if no such level", async function () {
			try {
				await SkillLevel.get(-1);
				fail();
			} catch (err) {
				expect(err instanceof NotFoundError).toBeTruthy();
			}
		});
	});

	describe("getAll", function () {
		test("works", async function () {
			await SkillLevel.create("New Level");

			const levels = await SkillLevel.getAll();
			expect(levels).toEqual([
				{ id: expect.any(Number), name: "Beginner" },
				{ id: expect.any(Number), name: "Intermediate" },
				{ id: expect.any(Number), name: "Advanced" },
				{ id: expect.any(Number), name: "New Level" },
			]);
		});
	});

	describe("delete", function () {
		test("works", async function () {
			const skillLevel = await SkillLevel.create("New Level");
			await SkillLevel.delete(skillLevel.id);

			const res = await db.query(
				"SELECT name FROM skill_levels WHERE name = 'New Level'"
			);
			expect(res.rows.length).toEqual(0);
		});

		test("not found if no such level", async function () {
			try {
				await SkillLevel.delete(-1);
				fail();
			} catch (err) {
				expect(err instanceof NotFoundError).toBeTruthy();
			}
		});
	});
});
