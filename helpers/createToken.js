const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/** return signed JWT token from teacher data */
function createToken(teacher) {
	const payload = {
		id: teacher.id,
		isAdmin: teacher.isAdmin || false,
	};

	return jwt.sign(payload, SECRET_KEY);
}

module.exports = createToken;
