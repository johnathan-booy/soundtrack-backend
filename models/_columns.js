// Arrays with columns to be used in select and returning clauses
// Snake_cased names are converted to camelCase
// Several arrays have a full version with all the columns, and a min version with only the necessary ones

const skillLevelCols = ["id", "name"];

const teacherCols = [
	"id",
	"email",
	"name",
	"description",
	"is_admin as isAdmin",
];

const studentCols = [
	"id",
	"name",
	"email",
	"description",
	"skill_level_id AS skillLevelId",
	"teacher_id AS teacherId",
];
const studentMinCols = [
	"id",
	"name",
	"email",
	"skill_level_id AS skillLevelId",
];

const techniqueCols = [
	"id",
	"tonic",
	"mode",
	"type",
	"description",
	"skill_level_id AS skillLevelId",
	"date_added AS dateAdded",
	"teacher_id AS teacherId",
];
const techniqueMinCols = [
	"id",
	"tonic",
	"mode",
	"type",
	"description",
	"skill_level_id AS skillLevelId",
	"date_added AS dateAdded",
];

const repertoireCols = [
	"id",
	"name",
	"composer",
	"arranger",
	"genre",
	"sheet_music_url AS sheetMusicUrl",
	"description",
	"date_added AS dateAdded",
	"skill_level_id AS skillLevelId",
	"teacher_id AS teacherId",
];

const repertoireMinCols = [
	"id",
	"name",
	"composer",
	"arranger",
	"genre",
	"sheet_music_url AS sheetMusicUrl",
	"description",
	"date_added AS dateAdded",
	"skill_level_id AS skillLevelId",
];

const lessonCols = [
	"id",
	"date",
	"notes",
	"student_id AS studentId",
	"teacher_id AS teacherId",
];
const lessonMinCols = ["id", "date", "notes"];

module.exports = {
	skillLevelCols,
	teacherCols,
	studentCols,
	studentMinCols,
	repertoireCols,
	repertoireMinCols,
	techniqueCols,
	techniqueMinCols,
	lessonCols,
	lessonMinCols,
};
