/**
 * Represents an error that occurs during the processing of an HTTP request in an Express application.
 *
 * This custom error class extends the built-in JavaScript `Error` class,
 * and adds the ability to set the status code of the error.
 *
 * @param {string} message - The error message.
 * @param {number} status - The HTTP status code to set for the error.
 *
 * @class
 */
class ExpressError extends Error {
	constructor(message, status) {
		super();
		this.message = message;
		this.status = status;
	}
}

/**
 * 404 NOT FOUND error.
 * This error is typically used when a requested resource is not found on the server.
 *
 * @class
 */
class NotFoundError extends ExpressError {
	constructor(message = "Not Found") {
		super(message, 404);
	}
}

/**
 * 401 UNAUTHORIZED error.
 * This error is typically used when a client attempts to access a protected resource without providing valid authentication credentials.
 *
 * @class
 */
class UnauthorizedError extends ExpressError {
	constructor(message = "Unauthorized") {
		super(message, 401);
	}
}

/**
 * 400 BAD REQUEST error.
 * This error is typically used when a client submits an invalid or malformed request to the server.
 *
 * @class
 */
class BadRequestError extends ExpressError {
	constructor(message = "Bad Request") {
		super(message, 400);
	}
}

/**
 * 403 FORBIDDEN error.
 * Unlike UnauthorizedError,the client may be authenticated, but still lacks the necessary permissions to access a protected resource
 *
 * @class
 */
class ForbiddenError extends ExpressError {
	constructor(message = "Forbidden") {
		super(message, 403);
	}
}

module.exports = {
	ExpressError,
	NotFoundError,
	UnauthorizedError,
	BadRequestError,
	ForbiddenError,
};
