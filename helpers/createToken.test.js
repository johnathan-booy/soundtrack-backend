const { SECRET_KEY } = require("../config");
const createToken = require("./createToken");
const jwt = require("jsonwebtoken");

describe("createToken", () => {
	test("works: not admin", () => {
		const token = createToken({ id: "test", isAdmin: false });
		const payload = jwt.verify(token, SECRET_KEY);
		expect(payload).toEqual({
			iat: expect.any(Number),
			id: "test",
			isAdmin: false,
		});
	});
	test("works: admin", () => {
		const token = createToken({ id: "test", isAdmin: true });
		const payload = jwt.verify(token, SECRET_KEY);
		expect(payload).toEqual({
			iat: expect.any(Number),
			id: "test",
			isAdmin: true,
		});
	});
	test("works: default no admin", () => {
		const token = createToken({ id: "test" });
		const payload = jwt.verify(token, SECRET_KEY);
		expect(payload).toEqual({
			iat: expect.any(Number),
			id: "test",
			isAdmin: false,
		});
	});
});
