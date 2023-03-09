const yup = require("yup");

const studentSearchSchema = yup
	.object()
	.shape({
		teacherId: yup.string(),
		name: yup.string(),
		skillLevelId: yup.number(),
	})
	.noUnknown()
	.strict();

module.exports = studentSearchSchema;
