const yup = require("yup");

const teacherNewSchema = yup
	.object()
	.shape({
		email: yup.string().email().required(),
		password: yup.string().min(8).required(),
		name: yup.string().min(2).max(50).required(),
		description: yup.string(),
		isAdmin: yup.boolean(),
	})
	.noUnknown()
	.strict();

module.exports = teacherNewSchema;
