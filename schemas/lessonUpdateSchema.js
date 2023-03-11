const yup = require("yup");

const lessonUpdateSchema = yup
	.object()
	.shape({
		teacherId: yup.string(),
		studentId: yup.number(),
		notes: yup.string(),
		date: yup.string(),
	})
	.noUnknown()
	.strict();

module.exports = lessonUpdateSchema;
