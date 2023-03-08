"use strict";

// Import required dependencies
const express = require("express"); // Express framework
const morgan = require("morgan"); // HTTP request logger middleware
const cors = require("cors"); // Cross-Origin Resource Sharing middleware
const { authJWT } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const teacherRoutes = require("./routes/teachers");
const studentRoutes = require("./routes/students");
const { NotFoundError } = require("./expressError");

const app = express(); // Create new instance of express app

// Enable CORS for all routes
app.use(cors());

// Log HTTP requests to console
app.use(morgan("tiny"));

// Parse request bodies as JSON
app.use(express.json());

// Authenticate token for all routes
app.use(authJWT);

// Routers
app.use("/auth", authRoutes);
app.use("/teachers", teacherRoutes);
app.use("/students", studentRoutes);

/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
	return next(new NotFoundError());
});

/** Generic error handler; anything unhandled goes here. */
app.use(function (err, req, res, next) {
	if (process.env.NODE_ENV !== "test") console.error(err.stack);
	const status = err.status || 500;
	const message = err.message;

	return res.status(status).json({
		error: { message, status },
	});
});

module.exports = app;
