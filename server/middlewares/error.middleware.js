import { ErrorHandler } from "../utils/ErrorHandler.js";

const errorMiddleware = (err, req, res, next) => {
  // 1. Initial setup
  let error = { ...err };
  error.message = err.message || "Internal Server Error";

  // 2. Log for Development
  if (process.env.NODE_ENV === "development") {
    console.error("\x1b[31m%s\x1b[0m", `[ERROR] ${err.message}`);
    console.error(err.stack);
  }

  // 3. Handle specific SyntaxErrors (Bad JSON)
  // This happens when the user sends malformed JSON to the server
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    error = new ErrorHandler(
      400,
      "Invalid JSON payload provided. Check your syntax!"
    );
  }

  // 4. MongoDB: Invalid ID (CastError)
  if (err.name === "CastError") {
    error = new ErrorHandler(400, `Resource not found. Invalid: ${err.path}`);
  }

  // 5. MongoDB: Duplicate Key (e.g., Email already exists)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {});
    error = new ErrorHandler(400, `Duplicate ${field} entered`);
  }

  // 6. Mongoose: Validation Error (e.g., password too short)
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = new ErrorHandler(400, message);
  }

  // 7. JWT Errors
  if (err.name === "JsonWebTokenError") {
    error = new ErrorHandler(401, "Json Web Token is invalid. Try again!");
  }

  if (err.name === "TokenExpiredError") {
    error = new ErrorHandler(401, "Json Web Token is expired. Log in again!");
  }

  // Safety check to ensure standard formatting
  if (!(error instanceof ErrorHandler)) {
    error = new ErrorHandler(
      error.statusCode || 500,
      error.message || "Internal Server Error",
      error?.errors || [],
      err.stack
    );
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message,
    errors: error.errors,
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  });
};

export { errorMiddleware };
