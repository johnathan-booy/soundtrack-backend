const db = require("../db/db");
const Technique = require("../models/technique");
const { NotFoundError, BadRequestError } = require("../expressError");
const { v4: uuid } = require("uuid");

const {
	commonAfterAll,
	commonBeforeEach,
	testIds,
	adminId,
} = require("../_testCommon");
const { techniqueCols } = require("./_columns");

afterAll(commonAfterAll);
beforeEach(commonBeforeEach);

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
				skillLevelId: testIds.skillLevels[0],
				dateAdded: expect.any(Date),
				teacherId: testIds.teachers[0],
			},
			{
				id: testIds.techniques[1],
				tonic: "D",
				mode: "Dorian",
				type: "Scale",
				description: "This is another scale",
				skillLevelId: testIds.skillLevels[1],
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
			skillLevelId: testIds.skillLevels[0],
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
			skillLevelId: testIds.skillLevels[1],
			teacherId: adminId,
		});

		const [found] = await db("techniques")
			.select(techniqueCols)
			.where({ id: technique.id });
		expect(found.tonic).toEqual("E");
		expect(found.mode).toEqual("Phrygian");
		expect(found.type).toEqual("Scale");
		expect(found.description).toEqual("This is a new scale");
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

describe("update", () => {
	const updateData = {
		tonic: "E",
		mode: "Phrygian",
		type: "Scale",
		description: "This is a new scale",
	};

	it("works", async () => {
		const technique = await Technique.update(testIds.techniques[0], {
			...updateData,
			skillLevelId: testIds.skillLevels[1],
		});
		expect(technique).toEqual({
			id: expect.any(Number),
			tonic: "E",
			mode: "Phrygian",
			type: "Scale",
			description: "This is a new scale",
			dateAdded: expect.any(Date),
			skillLevelId: testIds.skillLevels[1],
			teacherId: adminId,
		});
	});

	it("throws NotFoundError if technique id not found", async () => {
		try {
			await Technique.update(-1, updateData); // Nonexistent technique id
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});

	it("throws BadRequestError if teacher id is invalid", async () => {
		try {
			const resp = await Technique.update(testIds.techniques[0], {
				teacherId: uuid(), // Invalid teacher id
			});
			console.log(resp);
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});

	it("throws BadRequestError if skill level id is invalid", async () => {
		try {
			await Technique.update(testIds.techniques[0], {
				skillLevelId: -1, // Invalid skill level id
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
		const rows = await db("techniques")
			.select("id")
			.where({ id: testIds.techniques[0] });
		expect(rows.length).toEqual(0);
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
