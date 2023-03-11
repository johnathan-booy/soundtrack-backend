const yup = require("yup");

const lessonNewSchema = yup
	.object()
	.shape({
		teacherId: yup.string().required(),
		studentId: yup.number().required(),
		notes: yup.string(),
		date: yup.string(),
	})
	.noUnknown()
	.strict();

module.exports = lessonNewSchema;
