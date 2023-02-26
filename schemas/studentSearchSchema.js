const yup = require("yup");

const studentSearchSchema = yup.object().shape({
	name: yup.string(),
	skillLevelId: yup.number(),
});

module.exports = studentSearchSchema;
