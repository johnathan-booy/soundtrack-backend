const yup = require("yup");

const lessonSearchSchema = yup
	.object()
	.shape({
		daysAgo: yup.number(),
	})
	.noUnknown()
	.strict();

module.exports = lessonSearchSchema;
