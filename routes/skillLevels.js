"use strict";

/** Dependencies */
const express = require("express");
const { loggedIn } = require("../middleware/auth");
const SkillLevel = require("../models/skillLevel");

/** Initialize express router */
const router = new express.Router();

router.get("/", async function (req, res, next) {
	/** GET /skill-levels
	 *
	 * Endpoint to get a list of all skill levels
	 *
	 * Returns:
	 * { skillLevels: [ { id, name } ] }
	 *
	 * Authorization not required
	 */
	try {
		const skillLevels = await SkillLevel.getAll();
		return res.json({ skillLevels });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
