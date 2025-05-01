const { v4: uuidv4 } = require("uuid");
const {
  createScheduleReportTemplate,
  findScheduleReportTemplateById,
  updateScheduleReportTemplate,
  deleteScheduleReportTemplate,
  findScheduleReportTemplateByUserId,
} = require("../models/template.model");
const logger = require("../config/logger");

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const create = async ({ user_id, description, dashboard_layout, status }) => {
  if (!user_id) {
    logger.error("User ID is required for template creation");
    throw new ValidationError("User ID is required");
  }
  const id = uuidv4();
  return await createScheduleReportTemplate(
    id,
    user_id,
    description,
    dashboard_layout,
    status || "active"
  );
};

const getById = async (id) => {
  if (!id) {
    logger.error("ID is required for template retrieval");
    throw new ValidationError("ID is required");
  }
  return await findScheduleReportTemplateById(id);
};

const update = async (id, { description, dashboard_layout }) => {
  if (!id) {
    logger.error("ID is required for template update");
    throw new ValidationError("ID is required");
  }
  const updates = {};
  if (description !== undefined) updates.description = description;
  if (dashboard_layout !== undefined)
    updates.dashboard_layout = dashboard_layout;
  if (Object.keys(updates).length === 0) {
    logger.error("No updates provided for template");
    throw new ValidationError("No updates provided");
  }
  return await updateScheduleReportTemplate(id, updates);
};

const remove = async (id) => {
  if (!id) {
    logger.error("ID is required for template deletion");
    throw new ValidationError("ID is required");
  }
  return await deleteScheduleReportTemplate(id);
};

const getByUserId = async (user_id) => {
  if (!user_id) {
    logger.error("User ID is required for template retrieval");
    throw new ValidationError("User ID is required");
  }
  return await findScheduleReportTemplateByUserId(user_id);
};

module.exports = { create, getById, update, remove, getByUserId };
