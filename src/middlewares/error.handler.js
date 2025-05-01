const logger = require("../config/logger");

const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}\nStack: ${err.stack}`);
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: err.message,
      errorCode: 400,
    });
  }
  if (err.status === 404) {
    return res.status(404).json({
      success: false,
      message: "Resource not found",
      errorCode: 404,
    });
  }
  return res.status(500).json({
    success: false,
    message: "Internal server error",
    errorCode: 500,
    error: err.message,
  });
};

module.exports = errorHandler;
