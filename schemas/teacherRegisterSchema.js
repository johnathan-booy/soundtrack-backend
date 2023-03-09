const yup = require("yup");

const teacherRegisterSchema = yup
	.object()
	.shape({
		email: yup.string().email().required(),
		password: yup.string().min(8).required(),
		name: yup.string().min(2).max(50).required(),
		description: yup.string(),
	})
	.noUnknown()
	.strict();

module.exports = teacherRegisterSchema;
