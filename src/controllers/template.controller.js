const templateService = require("../services/template.service");
const logger = require("../config/logger");
const { successResponse, errorResponse } = require("../utils/response.util");

const create = async (req, res) => {
  try {
    const newTemplate = await templateService.create(req.body);
    logger.info(
      `Created schedule report template with ID ${newTemplate.id} for user ${newTemplate.user_id}`
    );
    return successResponse(
      res,
      "Schedule report template created successfully",
      newTemplate,
      201
    );
  } catch (err) {
    if (err.name === "ValidationError") {
      return errorResponse(res, err.message, 400);
    }
    logger.error(`Failed to create schedule report template: ${err.message}`);
    return errorResponse(
      res,
      "Failed to create schedule report template",
      500,
      { error: err.message }
    );
  }
};

const get = async (req, res) => {
  const { id } = req.params;

  try {
    const template = await templateService.getById(id);
    if (!template) {
      logger.warn(`Schedule report template not found or inactive: ${id}`);
      return errorResponse(
        res,
        "Schedule report template not found or inactive",
        404
      );
    }
    return successResponse(
      res,
      "Schedule report template retrieved successfully",
      template
    );
  } catch (err) {
    logger.error(`Failed to retrieve schedule report template: ${err.message}`);
    return errorResponse(
      res,
      "Failed to retrieve schedule report template",
      500,
      { error: err.message }
    );
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const { description, dashboard_layout } = req.body;

  try {
    const updatedTemplate = await templateService.update(id, {
      description,
      dashboard_layout,
    });
    if (!updatedTemplate) {
      logger.warn(`Schedule report template not found or inactive: ${id}`);
      return errorResponse(
        res,
        "Schedule report template not found or inactive",
        404
      );
    }
    logger.info(`Updated schedule report template with ID ${id}`);
    return successResponse(
      res,
      "Schedule report template updated successfully",
      updatedTemplate
    );
  } catch (err) {
    if (err.name === "ValidationError") {
      return errorResponse(res, err.message, 400);
    }
    logger.error(`Failed to update schedule report template: ${err.message}`);
    return errorResponse(
      res,
      "Failed to update schedule report template",
      500,
      { error: err.message }
    );
  }
};

const remove = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedTemplate = await templateService.remove(id);
    if (!deletedTemplate) {
      logger.warn(`Schedule report template not found or inactive: ${id}`);
      return errorResponse(
        res,
        "Schedule report template not found or inactive",
        404
      );
    }
    logger.info(`Soft-deleted schedule report template with ID ${id}`);
    return successResponse(
      res,
      "Schedule report template soft-deleted successfully",
      {}
    );
  } catch (err) {
    logger.error(
      `Failed to soft-delete schedule report template: ${err.message}`
    );
    return errorResponse(
      res,
      "Failed to soft-delete schedule report template",
      500,
      { error: err.message }
    );
  }
};

const getByUserId = async (req, res) => {
  const { user_id } = req.params;

  try {
    const templates = await templateService.getByUserId(user_id);
    return successResponse(
      res,
      "Schedule report templates retrieved successfully",
      templates
    );
  } catch (err) {
    logger.error(
      `Failed to retrieve schedule report templates for user ${user_id}: ${err.message}`
    );
    return errorResponse(
      res,
      "Failed to retrieve schedule report templates",
      500,
      { error: err.message }
    );
  }
};

module.exports = {
  createScheduleReportTemplate: create,
  getScheduleReportTemplate: get,
  updateScheduleReportTemplate: update,
  deleteScheduleReportTemplate: remove,
  getScheduleReportTemplatesByUserId: getByUserId,
};
