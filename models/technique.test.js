const db = require("../db");
const Technique = require("../models/technique");
const { NotFoundError, BadRequestError } = require("../expressError");

const {
	commonBeforeAll,
	commonAfterAll,
	commonBeforeEach,
	commonAfterEach,
	testIds,
	adminId,
} = require("../_testCommon");

beforeAll(commonBeforeAll);
afterAll(commonAfterAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);

describe("getAll", function () {
	test("works", async function () {
		const techniques = await Technique.getAll();
		expect(techniques).toEqual([
			{
				id: testIds.techniques[0],
				tonic: "C",
				mode: "Ionian",
				type: "Scale",
				description: "This is a scale",
				skillLevel: "Beginner",
				dateAdded: expect.any(Date),
				teacherId: testIds.teachers[0],
			},
			{
				id: testIds.techniques[1],
				tonic: "D",
				mode: "Dorian",
				type: "Scale",
				description: "This is another scale",
				skillLevel: "Intermediate",
				dateAdded: expect.any(Date),
				teacherId: testIds.teachers[1],
			},
		]);
	});
});

describe("get", function () {
	test("works", async function () {
		const technique = await Technique.get(testIds.techniques[0]);
		expect(technique).toEqual({
			id: testIds.techniques[0],
			tonic: "C",
			mode: "Ionian",
			type: "Scale",
			description: "This is a scale",
			dateAdded: expect.any(Date),
			skillLevel: "Beginner",
			teacherId: testIds.teachers[0],
		});
	});

	test("not found if no such technique", async function () {
		try {
			await Technique.get(-1);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

describe("create", function () {
	const newTechnique = {
		tonic: "E",
		mode: "Phrygian",
		type: "Scale",
		description: "This is a new scale",
	};

	test("works", async function () {
		const technique = await Technique.create({
			...newTechnique,
			skillLevelId: testIds.skillLevels[1],
			teacherId: adminId,
		});
		expect(technique).toEqual({
			id: expect.any(Number),
			tonic: "E",
			mode: "Phrygian",
			type: "Scale",
			description: "This is a new scale",
			dateAdded: expect.any(Date),
			skillLevel: "Intermediate",
			teacherId: adminId,
		});

		const result = await db.query(
			`SELECT id, tonic, mode, type, description, date_added AS "dateAdded", skill_level_id AS "skillLevelId", teacher_id AS "teacherId"
       FROM techniques
       WHERE id = ${technique.id}`
		);
		expect(result.rows[0].tonic).toEqual("E");
		expect(result.rows[0].mode).toEqual("Phrygian");
		expect(result.rows[0].type).toEqual("Scale");
		expect(result.rows[0].description).toEqual("This is a new scale");
	});

	test("bad request with duplicate", async function () {
		try {
			await Technique.create(newTechnique);
			await Technique.create(newTechnique);
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});

	test("bad request with missing tonic", async function () {
		try {
			await Technique.create({
				...newTechnique,
				tonic: undefined,
			});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});

	test("bad request with missing teacherId", async function () {
		try {
			await Technique.create({
				...newTechnique,
				teacherId: undefined,
			});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

describe("delete", function () {
	test("works", async function () {
		await Technique.delete(testIds.techniques[0]);
		const res = await db.query("SELECT id FROM techniques WHERE id=$1", [
			testIds.techniques[0],
		]);
		expect(res.rows.length).toEqual(0);
	});

	test("not found if no such technique", async function () {
		try {
			await Technique.delete(0);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});
