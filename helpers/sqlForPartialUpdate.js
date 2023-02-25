const { BadRequestError } = require("../expressError");

/**
 * Helper for making selective update queries.
 *
 * The calling function can use it to make the SET clause of an SQL UPDATE
 * statement.
 *
 * @param {Object} dataToUpdate {field1: newVal, field2: newVal, ...}
 * @param {Object} jsToSql maps js-style data fields to database column names,
 *   like { firstName: "first_name", age: "age" }
 *
 * @returns {Object} {setCols, values}
 *
 * @example
 *   // Example: Update email and description for a teacher
 *   const dataToUpdate = { email: 'new-email@example.com', description: 'New description' };
 *   const jsToSql = { email: 'email', description: 'description' };
 *   const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
 *   // Returns: { setCols: "email=$1, description=$2", values: ["new-email@example.com", "New description"] }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
	if (Object.keys(dataToUpdate).length === 0) {
		throw new BadRequestError("No data");
	}

	const setCols = [];
	const values = [];

	for (let key in dataToUpdate) {
		let colName = jsToSql[key] || key;
		setCols.push(`${colName}=$${setCols.length + 1}`);
		values.push(dataToUpdate[key]);
	}

	return {
		setCols: setCols.join(", "),
		values: values,
	};
}

module.exports = { sqlForPartialUpdate };
