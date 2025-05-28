const { body, param, validationResult } = require("express-validator");
const { errorResponse } = require("../utils/response.util");

const createScheduleReportValidation = [
  body("template_id").isUUID().withMessage("Template ID must be a valid UUID"),
  body("cron_expr").notEmpty().withMessage("Cron expression is required"),
  body("timezone").notEmpty().withMessage("Timezone is required"),
  body("pre_gen_offset_min")
    .isInt()
    .optional()
    .withMessage("Pre-gen offset must be an integer"),
  body("title").notEmpty().withMessage("Title is required"),
  body("recipients")
    .custom((value) => {
      const emailArray = Array.isArray(value) ? value : value.split(',').map(email => email.trim());
      const emailRegex = /^\S+@\S+\.\S+$/;
      return emailArray.every(email => emailRegex.test(email));
    })
    .withMessage("All recipients must have valid email formats"),
  body("user_id").isInt().withMessage("User ID must be an integer"),
  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be 'active' or 'inactive'"),
];

const updateScheduleReportValidation = [
  param("id").isUUID().withMessage("ID must be a valid UUID"),
  body("cron_expr")
    .notEmpty()
    .optional()
    .withMessage("Cron expression is required"),
  body("timezone").notEmpty().optional().withMessage("Timezone is required"),
  body("pre_gen_offset_min")
    .isInt()
    .optional()
    .withMessage("Pre-gen offset must be an integer"),
  body("title").notEmpty().optional().withMessage("Title is required"),
  body("recipients")
    .notEmpty()
    .optional()
    .withMessage("Recipients are required"),
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
  createScheduleReportValidation,
  updateScheduleReportValidation,
  findByUserIdValidation,
  validateScheduleReport: validate,
};
