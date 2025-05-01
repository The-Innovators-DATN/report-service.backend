/**
 * Send a success response
 * @param {object} res - Express response object
 * @param {string} message - Success message
 * @param {object} data - Response data
 * @param {number} [status=200] - HTTP status code
 * @returns {object} JSON response
 */
const successResponse = (res, message, data, status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} [status=400] - HTTP status code
 * @param {object} [details={}] - Additional error details
 * @returns {object} JSON response
 */
const errorResponse = (res, message, status = 400, details = {}) => {
  return res.status(status).json({
    success: false,
    message,
    errorCode: status,
    ...details,
  });
};

module.exports = { successResponse, errorResponse };
