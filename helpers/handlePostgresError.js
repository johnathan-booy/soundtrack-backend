const { BadRequestError } = require("../expressError");

function handlePostgresError(err) {
	console.log(err);
	if (err.code === "23503") {
		const [_, key] = err.detail.match(/Key \((.*?)\)/);
		throw new BadRequestError(`'${key}' is invalid`);
	} else if (err.code === "23505") {
		const [, key] = err.detail.match(/Key \((.*?)\)=/);
		throw new BadRequestError(`'${key}' already exists.`);
	} else if (err.code === "23502") {
		const { column } = err;
		throw new BadRequestError(`'${column}' is required`);
	} else if (err.code === "23514") {
		throw new BadRequestError(`Foreign key constraint violation`);
	} else {
		throw err;
	}
}

module.exports = handlePostgresError;
