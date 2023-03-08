"use strict";

const jwt = require("jsonwebtoken");

const { authJWT } = require("./auth");

const { SECRET_KEY } = require("../config");

const testJWT = jwt.sign({ id: "thisIsAStringId", isAdmin: false }, SECRET_KEY);
const badJWT = jwt.sign({ id: "thisIsAStringId", isAdmin: false }, "wrong");

describe("authJWT", () => {
	it("should authenticate via header", () => {
		expect.assertions(2);

		// Set request objects
		const req = { headers: { authorization: `Bearer ${testJWT}` } };
		const res = { locals: {} };
		const next = function (err) {
			expect(err).toBeFalsy();
		};

		// Check authJWT
		authJWT(req, res, next);
		expect(res.locals).toEqual({
			teacher: {
				iat: expect.any(Number),
				id: "thisIsAStringId",
				isAdmin: false,
			},
		});
	});

	it("should not authenticate without header", () => {
		expect.assertions(2);

		// Set request objects
		const req = {};
		const res = { locals: {} };
		const next = function (err) {
			expect(err).toBeFalsy();
		};

		// Check authJWT
		authJWT(req, res, next);
		expect(res.locals).toEqual({});
	});

	it("should not authenticate with bad header", () => {
		expect.assertions(2);

		// Set request objects
		const req = { headers: { authorization: `Bearer ${badJWT}` } };
		const res = { locals: {} };
		const next = function (err) {
			expect(err).toBeFalsy();
		};

		// Check authJWT
		authJWT(req, res, next);
		expect(res.locals).toEqual({});
	});
});
