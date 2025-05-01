const { query, param, body, validationResult } = require("express-validator");
const { errorResponse } = require("../utils/response.util");

const getReportHistoryValidation = [
  query("page")
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),
  query("limit")
    .isInt({ min: 1 })
    .withMessage("limit must be a positive integer"),
  query("uid").optional().isUUID().withMessage("uid must be a valid UUID"),
  query("report_id")
    .optional()
    .isUUID()
    .withMessage("report_id must be a valid UUID"),
  query("user_id").optional().isInt().withMessage("user_id must be an integer"),
  query("recipients")
    .optional()
    .isString()
    .withMessage("recipients must be a string"),
  query("attachment_id")
    .optional()
    .isUUID()
    .withMessage("attachment_id must be a valid UUID"),
  query("status")
    .optional()
    .isIn(["success", "failed", "retrying"])
    .withMessage("status must be 'success', 'failed', or 'retrying'"),
  query("attempt")
    .optional()
    .isInt({ min: 1, max: 3 })
    .withMessage("attempt must be between 1 and 3"),
  query("error_message")
    .optional()
    .isString()
    .withMessage("error_message must be a string"),
  query("sent_at")
    .optional()
    .isISO8601()
    .withMessage("sent_at must be a valid ISO 8601 date"),
];

const updateReportHistoryValidation = [
  param("uid").isUUID().withMessage("uid must be a valid UUID"),
  body("status")
    .optional()
    .isIn(["success", "failed", "retrying"])
    .withMessage("status must be 'success', 'failed', or 'retrying'"),
  body("attempt")
    .optional()
    .isInt({ min: 1, max: 3 })
    .withMessage("attempt must be between 1 and 3"),
  body("error_message")
    .optional()
    .isString()
    .withMessage("error_message must be a string"),
  body("sent_at")
    .optional()
    .isISO8601()
    .withMessage("sent_at must be a valid ISO 8601 date"),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, "validation failed", 400, {
      errors: errors.array(),
    });
  }
  next();
};

module.exports = {
  getReportHistoryValidation,
  updateReportHistoryValidation,
  validateReportHistory: validate,
};
