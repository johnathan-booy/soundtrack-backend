const yup = require("yup");

const studentUpdateSchema = yup
	.object()
	.shape({
		email: yup.string().email(),
		name: yup.string().min(2).max(50),
		description: yup.string(),
		skillLevelId: yup.number(),
	})
	.noUnknown()
	.strict();

module.exports = studentUpdateSchema;
