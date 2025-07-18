import ErrorResponse from "../utils/errorResponse.js";

// Middleware for handling errors

const errorHandler = (err, req, res, next) => {
  // Log the error to the console
  console.error(err);

  let error = { ...err };
  error.message = err.message;

  // Handle Duplicate Key Error
  if (error.name === "MongoError" && error.code === 11000) {
    const message = "Duplicate field value entered";
    error = new ErrorResponse(message, 400);
  }

  // Handle MongoDB CastError (Invalid ID)
  if (error.name === "CastError") {
    const message = "Resource not found";
    error = new ErrorResponse(message, 404);
  }

  // Handle MongoDB Validation Errors
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((error) => error.message)
      .join(", ");
    error = new ErrorResponse(message, 400);
  }

  // Send the error response to the client
  res.status(error.statusCode || 500).json({
    success: false,
    data: { error: error.message || "Internal Server Error" },
  });
};

export default errorHandler;
