const yup = require("yup");

const teacherAuthSchema = yup
	.object()
	.shape({
		email: yup.string().email().required(),
		password: yup.string().min(8).required(),
	})
	.noUnknown()
	.strict();

module.exports = teacherAuthSchema;
