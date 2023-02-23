"use strict";

describe("config can come from env", () => {
	it("works", () => {
		process.env.PORT = "5000";
		process.env.SECRET_KEY = "bicycle";

		const config = require("./config");
		expect(config.PORT).toEqual(5000);
		expect(config.SECRET_KEY).toEqual("bicycle");

		delete process.env.PORT;
		delete process.env.SECRET_KEY;
	});
});
