const db = require("../db/db");
const Repertoire = require("../models/repertoire");
const { NotFoundError, BadRequestError } = require("../expressError");

const {
	commonAfterAll,
	commonBeforeEach,
	testIds,
	adminId,
	teacherId,
} = require("../_testCommon");

afterAll(commonAfterAll);
beforeEach(commonBeforeEach);

describe("getAll", function () {
	test("works", async function () {
		const repertoire = await Repertoire.getAll();
		expect(repertoire).toEqual([
			{
				id: testIds.repertoire[0],
				name: "Piece1",
				composer: "Composer1",
				arranger: "Arranger1",
				genre: "Classical",
				sheetMusicUrl: "https://example.com/sheetmusic1",
				description: "This is a piece",
				skillLevelId: testIds.skillLevels[0],
				dateAdded: expect.any(Date),
				teacherId: testIds.teachers[0],
			},
			{
				id: testIds.repertoire[1],
				name: "Piece2",
				composer: "Composer2",
				arranger: null,
				genre: "Pop",
				sheetMusicUrl: "https://example.com/sheetmusic2",
				description: "This is another piece",
				skillLevelId: testIds.skillLevels[1],
				dateAdded: expect.any(Date),
				teacherId: testIds.teachers[1],
			},
		]);
	});
});

describe("get", function () {
	test("works", async function () {
		const repertoire = await Repertoire.get(testIds.repertoire[0]);
		expect(repertoire).toEqual({
			id: testIds.repertoire[0],
			name: "Piece1",
			composer: "Composer1",
			arranger: "Arranger1",
			genre: "Classical",
			sheetMusicUrl: "https://example.com/sheetmusic1",
			description: "This is a piece",
			skillLevelId: testIds.skillLevels[0],
			dateAdded: expect.any(Date),
			teacherId: testIds.teachers[0],
		});
	});

	test("not found if no such repertoire", async function () {
		try {
			await Repertoire.get(-1);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

describe("create", function () {
	const newRepertoire = {
		name: "New Piece",
		composer: "Composer3",
		arranger: null,
		genre: "Rock",
		sheetMusicUrl: "https://example.com/new-piece",
		description: "This is a new piece",
	};

	test("works", async function () {
		const repertoire = await Repertoire.create({
			...newRepertoire,
			skillLevelId: testIds.skillLevels[2],
			teacherId: adminId,
		});
		expect(repertoire).toEqual({
			id: expect.any(Number),
			name: "New Piece",
			composer: "Composer3",
			arranger: null,
			genre: "Rock",
			sheetMusicUrl: "https://example.com/new-piece",
			description: "This is a new piece",
			dateAdded: expect.any(Date),
			skillLevelId: testIds.skillLevels[2],
			teacherId: adminId,
		});

		const [found] = await db("repertoire")
			.select("*")
			.where({ id: repertoire.id });

		expect(found.name).toEqual("New Piece");
		expect(found.composer).toEqual("Composer3");
		expect(found.arranger).toEqual(null);
		expect(found.genre).toEqual("Rock");
		expect(found.sheet_music_url).toEqual("https://example.com/new-piece");
		expect(found.description).toEqual("This is a new piece");
	});

	test("bad request with duplicate", async function () {
		try {
			await Repertoire.create(newRepertoire);
			await Repertoire.create(newRepertoire);
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});

	test("bad request with missing name", async function () {
		try {
			await Repertoire.create({
				...newRepertoire,
				name: undefined,
			});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});

	test("bad request with missing teacherId", async function () {
		try {
			await Repertoire.create({
				...newRepertoire,
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
		await Repertoire.delete(testIds.repertoire[0]);
		const rows = await db("repertoire")
			.select("*")
			.where({ id: testIds.repertoire[0] });
		expect(rows.length).toEqual(0);
	});

	test("not found if no such repertoire", async function () {
		try {
			await Repertoire.delete(0);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

describe("update", function () {
	test("works", async function () {
		const updatedRepertoire = {
			name: "Updated Piece1",
			composer: "Updated Composer1",
			arranger: "Updated Arranger1",
			genre: "Pop",
			sheetMusicUrl: "https://example.com/updated_sheetmusic1",
			description: "This is an updated piece",
			skillLevelId: testIds.skillLevels[1],
			teacherId: teacherId,
		};
		const repertoire = await Repertoire.update(
			testIds.repertoire[0],
			updatedRepertoire
		);

		expect(repertoire).toEqual({
			id: testIds.repertoire[0],
			name: "Updated Piece1",
			composer: "Updated Composer1",
			arranger: "Updated Arranger1",
			genre: "Pop",
			sheetMusicUrl: "https://example.com/updated_sheetmusic1",
			description: "This is an updated piece",
			dateAdded: expect.any(Date),
			skillLevelId: testIds.skillLevels[1],
			teacherId: teacherId,
		});

		const [found] = await db("repertoire")
			.select("*")
			.where({ id: testIds.repertoire[0] });

		expect(found.name).toEqual("Updated Piece1");
		expect(found.composer).toEqual("Updated Composer1");
		expect(found.arranger).toEqual("Updated Arranger1");
		expect(found.genre).toEqual("Pop");
		expect(found.sheet_music_url).toEqual(
			"https://example.com/updated_sheetmusic1"
		);
		expect(found.description).toEqual("This is an updated piece");
		expect(found.skill_level_id).toEqual(testIds.skillLevels[1]);
		expect(found.teacher_id).toEqual(teacherId);
	});

	test("not found if no such repertoire", async function () {
		try {
			await Repertoire.update(-1, {
				description: "test",
			});
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});
