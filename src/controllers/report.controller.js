const reportService = require("../services/report.service");
const logger = require("../config/logger");
const { successResponse, errorResponse } = require("../utils/response.util");

const create = async (req, res) => {
  try {
    if (!validateEmailList(req.body.recipients)) {
      logger.error("Invalid email format for one or more recipients");
      throw new ValidationError("Invalid email format for one or more recipients");
    }
    const newReport = await reportService.create(req.body);
    logger.info(
      `Created schedule report with ID ${newReport.id} for user ${newReport.user_id}`
    );
    return successResponse(
      res,
      "Schedule report created successfully",
      newReport,
      201
    );
  } catch (err) {
    if (err.name === "ValidationError") {
      return errorResponse(res, err.message, 400);
    }
    logger.error(`Failed to create schedule report: ${err.message}`);
    return errorResponse(res, "Failed to create schedule report", 500, {
      error: err.message,
    });
  }
};

const get = async (req, res) => {
  const { id } = req.params;

  try {
    const report = await reportService.getById(id);
    if (!report) {
      logger.warn(`Schedule report not found or inactive: ${id}`);
      return errorResponse(res, "Schedule report not found or inactive", 404);
    }
    return successResponse(
      res,
      "Schedule report retrieved successfully",
      report
    );
  } catch (err) {
    logger.error(`Failed to retrieve schedule report: ${err.message}`);
    return errorResponse(res, "Failed to retrieve schedule report", 500, {
      error: err.message,
    });
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  if (updates.recipients && !validateEmailList(updates.recipients)) {
    logger.error("Invalid email format for one or more recipients");
    throw new ValidationError("Invalid email format for one or more recipients");
  }
  try {
    const updatedReport = await reportService.update(id, updates);
    if (!updatedReport) {
      logger.warn(`Schedule report not found or inactive: ${id}`);
      return errorResponse(res, "Schedule report not found or inactive", 404);
    }
    logger.info(`Updated schedule report with ID ${id}`);
    return successResponse(
      res,
      "Schedule report updated successfully",
      updatedReport
    );
  } catch (err) {
    if (err.name === "ValidationError") {
      return errorResponse(res, err.message, 400);
    }
    logger.error(`Failed to update schedule report: ${err.message}`);
    return errorResponse(res, "Failed to update schedule report", 500, {
      error: err.message,
    });
  }
};

const remove = async (req, res) => {
  const { id } = req.params;
  logger.info(`Soft-deleting schedule report with ID ${id}`);
  try {
    const deletedReport = await reportService.remove(id);
    if (!deletedReport) {
      logger.warn(`Schedule report not found or inactive: ${id}`);
      return errorResponse(res, "Schedule report not found or inactive", 404);
    }
    logger.info(`Soft-deleted schedule report with ID ${id}`);
    return successResponse(
      res,
      "Schedule report soft-deleted successfully",
      {}
    );
  } catch (err) {
    logger.error(`Failed to soft-delete schedule report: ${err.message}`);
    return errorResponse(res, "Failed to soft-delete schedule report", 500, {
      error: err.message,
    });
  }
};

const getByUserId = async (req, res) => {
  const { user_id } = req.params;

  try {
    const reports = await reportService.getByUserId(user_id);
    return successResponse(
      res,
      "Schedule reports retrieved successfully",
      reports
    );
  } catch (err) {
    logger.error(
      `Failed to retrieve schedule reports for user ${user_id}: ${err.message}`
    );
    return errorResponse(res, "Failed to retrieve schedule reports", 500, {
      error: err.message,
    });
  }
};

const validateEmailList = (emails) => {
  const emailArray = Array.isArray(emails) ? emails : emails.split(',').map(email => email.trim());
  const emailRegex = /^\S+@\S+\.\S+$/;
  return emailArray.every(email => emailRegex.test(email));
};

module.exports = {
  createScheduleReport: create,
  getScheduleReport: get,
  updateScheduleReport: update,
  deleteScheduleReport: remove,
  getScheduleReportsByUserId: getByUserId,
};
