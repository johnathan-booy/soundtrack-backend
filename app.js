"use strict";

// Import required dependencies
const express = require("express"); // Express framework
const morgan = require("morgan"); // HTTP request logger middleware
const cors = require("cors"); // Cross-Origin Resource Sharing middleware

const app = express(); // Create new instance of express app

// Enable CORS for all routes
app.use(cors());

// Log HTTP requests to console
app.use(morgan("tiny"));

// Parse request bodies as JSON
app.use(express.json());

module.exports = app; // Export the app for use in other files
