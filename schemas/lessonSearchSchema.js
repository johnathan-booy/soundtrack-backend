const yup = require("yup");

const lessonSearchSchema = yup.object().shape({
	daysAgo: yup.number(),
});

module.exports = lessonSearchSchema;
