"use strict";

const jwt = require("jsonwebtoken");

const { authenticateJWT } = require("./auth");

const { SECRET_KEY } = require("../config");

const testJWT = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJWT = jwt.sign({ username: "test", isAdmin: false }, "wrong");

describe("authenticateJWT", () => {
	it("works: via header", () => {
		expect.assertions(2);

		// Set request objects
		const req = { headers: { authorization: `Bearer ${testJWT}` } };
		const res = { locals: {} };
		const next = function (err) {
			expect(err).toBeFalsy();
		};

		// Check authenticateJWT
		authenticateJWT(req, res, next);
		expect(res.locals).toEqual({
			user: {
				iat: expect.any(Number),
				username: "test",
				isAdmin: false,
			},
		});
	});
	it("works: no header", () => {
		expect.assertions(2);

		// Set request objects
		const req = {};
		const res = { locals: {} };
		const next = function (err) {
			expect(err).toBeFalsy();
		};

		// Check authenticateJWT
		authenticateJWT(req, res, next);
		expect(res.locals).toEqual({});
	});
	it("works: bad header", () => {
		expect.assertions(2);

		// Set request objects
		const req = { headers: { authorization: `Bearer ${badJWT}` } };
		const res = { locals: {} };
		const next = function (err) {
			expect(err).toBeFalsy();
		};

		// Check authenticateJWT
		authenticateJWT(req, res, next);
		expect(res.locals).toEqual({});
	});
});
