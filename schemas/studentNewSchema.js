const yup = require("yup");

const studentNewSchema = yup
	.object()
	.shape({
		email: yup.string().email().required(),
		name: yup.string().min(2).max(50).required(),
		description: yup.string(),
		skillLevelId: yup.number(),
		teacherId: yup.string(),
	})
	.noUnknown()
	.strict();

module.exports = studentNewSchema;
