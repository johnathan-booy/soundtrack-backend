const db = require("../db");
const Repertoire = require("../models/repertoire");
const { NotFoundError, BadRequestError } = require("../expressError");

const {
	commonBeforeAll,
	commonAfterAll,
	commonBeforeEach,
	commonAfterEach,
	testIds,
	adminId,
	teacherId,
} = require("../_testCommon");

beforeAll(commonBeforeAll);
afterAll(commonAfterAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);

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

		const result = await db.query(
			`SELECT id, name, composer, arranger, genre, sheet_music_url AS "sheetMusicUrl", description, date_added AS "dateAdded", skill_level_id AS "skillLevelId", teacher_id AS "teacherId"
       FROM repertoire
       WHERE id = ${repertoire.id}`
		);
		expect(result.rows[0].name).toEqual("New Piece");
		expect(result.rows[0].composer).toEqual("Composer3");
		expect(result.rows[0].arranger).toEqual(null);
		expect(result.rows[0].genre).toEqual("Rock");
		expect(result.rows[0].sheetMusicUrl).toEqual(
			"https://example.com/new-piece"
		);
		expect(result.rows[0].description).toEqual("This is a new piece");
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
		const res = await db.query("SELECT id FROM repertoire WHERE id=$1", [
			testIds.repertoire[0],
		]);
		expect(res.rows.length).toEqual(0);
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

		const result = await db.query(
			`SELECT id, name, composer, arranger, genre, sheet_music_url AS "sheetMusicUrl", description, date_added AS "dateAdded", skill_level_id AS "skillLevelId", teacher_id AS "teacherId"
             FROM repertoire
             WHERE id = $1`,
			[testIds.repertoire[0]]
		);
		expect(result.rows).toEqual([
			{
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
			},
		]);
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
