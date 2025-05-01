const { body, param, validationResult } = require("express-validator");
const { errorResponse } = require("../utils/response.util");

const createDashboardAttachmentValidation = [
  body("report_id")
    .isUUID()
    .optional()
    .withMessage("Report ID must be a valid UUID"),
  body("s3_key").notEmpty().withMessage("S3 key is required"),
  body("size").isInt().optional().withMessage("Size must be an integer"),
  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be 'active' or 'inactive'"),
];

const updateDashboardAttachmentValidation = [
  param("uid").isUUID().withMessage("UID must be a valid UUID"),
  body("report_id")
    .isUUID()
    .optional()
    .withMessage("Report ID must be a valid UUID"),
  body("s3_key").notEmpty().optional().withMessage("S3 key is required"),
  body("size").isInt().optional().withMessage("Size must be an integer"),
];

const findByReportIdValidation = [
  param("report_id").isUUID().withMessage("Report ID must be a valid UUID"),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, "Validation failed", 400, {
      errors: errors.array(),
    });
  }
  next();
};

module.exports = {
  createDashboardAttachmentValidation,
  updateDashboardAttachmentValidation,
  findByReportIdValidation,
  validateDashboardAttachment: validate,
};
