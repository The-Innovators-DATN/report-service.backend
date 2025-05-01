const { body, param, validationResult } = require("express-validator");
const { errorResponse } = require("../utils/response.util");

const createScheduleReportTemplateValidation = [
  body("user_id").isInt().withMessage("User ID must be an integer"),
  body("description")
    .isString()
    .optional()
    .withMessage("Description must be a string"),
  body("dashboard_layout")
    .notEmpty()
    .withMessage("Dashboard layout is required"),
  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be 'active' or 'inactive'"),
];

const updateScheduleReportTemplateValidation = [
  param("id").isUUID().withMessage("ID must be a valid UUID"),
  body("description")
    .isString()
    .optional()
    .withMessage("Description must be a string"),
  body("dashboard_layout")
    .notEmpty()
    .optional()
    .withMessage("Dashboard layout is required"),
];

const findByUserIdValidation = [
  param("user_id").isInt().withMessage("User ID must be an integer"),
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
  createScheduleReportTemplateValidation,
  updateScheduleReportTemplateValidation,
  findByUserIdValidation,
  validateScheduleReportTemplate: validate,
};
