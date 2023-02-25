const yup = require("yup");

const teacherUpdateSchema = yup.object().shape({
	email: yup.string().email(),
	password: yup.string().min(8),
	name: yup.string().min(2).max(50),
	description: yup.string(),
	isAdmin: yup.boolean(),
});

module.exports = teacherUpdateSchema;
