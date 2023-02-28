const Lesson = require("./lesson");
const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	testIds,
} = require("../_testCommon");
const { NotFoundError, BadRequestError } = require("../expressError");
const db = require("../db");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("Lesson", () => {
	describe("get", () => {
		test("retrieves a lesson by id", async () => {
			const lesson = await Lesson.get(testIds.lessons[0]);
			expect(lesson).toEqual({
				id: testIds.lessons[0],
				date: expect.any(Date),
				notes: "This is a note",
				studentId: testIds.students[0],
				studentName: "Student1",
				teacherId: testIds.teachers[0],
				teacherName: "Teacher1",
			});
		});

		test("throws NotFoundError if lesson not found", async () => {
			try {
				await Lesson.get(-1); // Nonexistent lesson id
				fail();
			} catch (err) {
				expect(err instanceof NotFoundError).toBeTruthy();
			}
		});
	});

	describe("create", () => {
		test("creates a new lesson", async () => {
			const newLesson = {
				teacherId: testIds.teachers[0],
				studentId: testIds.students[1],
				notes: "This is a new note",
			};
			const lesson = await Lesson.create(newLesson);
			expect(lesson).toEqual({
				id: expect.any(Number),
				date: expect.any(Date),
				notes: "This is a new note",
				studentId: testIds.students[1],
				teacherId: testIds.teachers[0],
			});

			const found = await db.query("SELECT * FROM lessons WHERE id = $1", [
				lesson.id,
			]);
			expect(found.rows.length).toEqual(1);
			expect(found.rows[0].student_id).toEqual(testIds.students[1]);
			expect(found.rows[0].teacher_id).toEqual(testIds.teachers[0]);
			expect(found.rows[0].notes).toEqual("This is a new note");
		});

		test("throws a bad request with invalid studentId", async () => {
			try {
				await Lesson.create({ teacherId: testIds.teachers[0], studentId: -1 });
				fail();
			} catch (err) {
				expect(err instanceof BadRequestError).toBeTruthy();
			}
		});

		test("throws a bad request with invalid teacherId", async () => {
			try {
				await Lesson.create({ teacherId: -1, studentId: testIds.students[0] });
				fail();
			} catch (err) {
				expect(err instanceof BadRequestError).toBeTruthy();
			}
		});
	});

	describe("update", () => {
		test("updates a lesson's notes", async () => {
			const res = await Lesson.update(testIds.lessons[0], {
				notes: "Updated notes",
			});

			expect(res).toEqual({
				id: testIds.lessons[0],
				date: expect.any(Date),
				notes: "Updated notes",
				studentId: testIds.students[0],
				teacherId: testIds.teachers[0],
			});

			const updatedLesson = await Lesson.get(testIds.lessons[0]);
			expect(updatedLesson.notes).toBe("Updated notes");
		});

		test("updates a lesson's date", async () => {
			const date = new Date();
			const res = await Lesson.update(testIds.lessons[0], { date });

			expect(res).toEqual({
				id: testIds.lessons[0],
				date,
				notes: "This is a note",
				studentId: testIds.students[0],
				teacherId: testIds.teachers[0],
			});

			const updatedLesson = await Lesson.get(testIds.lessons[0]);
			expect(updatedLesson.date).toEqual(date);
		});

		test("updates a lesson's student", async () => {
			const res = await Lesson.update(testIds.lessons[0], {
				studentId: testIds.students[1],
			});

			expect(res).toEqual({
				id: testIds.lessons[0],
				date: expect.any(Date),
				notes: "This is a note",
				studentId: testIds.students[1],
				teacherId: testIds.teachers[0],
			});

			const updatedLesson = await Lesson.get(testIds.lessons[0]);
			expect(updatedLesson.studentId).toBe(testIds.students[1]);
		});

		test("updates a lesson's teacher", async () => {
			const res = await Lesson.update(testIds.lessons[0], {
				teacherId: testIds.teachers[1],
			});

			expect(res).toEqual({
				id: testIds.lessons[0],
				date: expect.any(Date),
				notes: "This is a note",
				studentId: testIds.students[0],
				teacherId: testIds.teachers[1],
			});

			const updatedLesson = await Lesson.get(testIds.lessons[0]);
			expect(updatedLesson.teacherId).toBe(testIds.teachers[1]);
		});

		test("throws NotFoundError if lesson not found", async () => {
			try {
				await Lesson.update(-1, { notes: "updated" }); // Nonexistent lesson id
				fail();
			} catch (err) {
				expect(err instanceof NotFoundError).toBeTruthy();
			}
		});

		test("throws BadRequestError with invalid teacherId", async () => {
			try {
				await Lesson.update(testIds.lessons[0], { teacherId: -1 });
				fail();
			} catch (err) {
				expect(err instanceof BadRequestError).toBeTruthy();
			}
		});

		test("throws BadRequestError with invalid studentId", async () => {
			try {
				await Lesson.update(testIds.lessons[0], { studentId: -1 });
				fail();
			} catch (err) {
				expect(err instanceof BadRequestError).toBeTruthy();
			}
		});
	});

	describe("delete", () => {
		test("deletes a lesson", async () => {
			await Lesson.delete(testIds.lessons[0]);
			const result = await db.query("SELECT id FROM lessons WHERE id=$1", [
				testIds.lessons[0],
			]);
			expect(result.rows.length).toEqual(0);
		});

		test("throws NotFoundError if no such lesson", async () => {
			try {
				await Lesson.delete(-1);
				fail();
			} catch (err) {
				expect(err instanceof NotFoundError).toBeTruthy();
			}
		});
	});
});
