const { v4: uuidv4 } = require("uuid");
const {
  createDashboardAttachment,
  findDashboardAttachmentById,
  updateDashboardAttachment,
  deleteDashboardAttachment,
  findDashboardAttachmentByReportId,
} = require("../models/attachment.model");
const logger = require("../config/logger");

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const create = async ({ report_id, s3_key, status }) => {
  if (!s3_key) {
    logger.error("S3 key is required for attachment creation");
    throw new ValidationError("S3 key is required");
  }
  const uid = uuidv4();
  return await createDashboardAttachment(
    uid,
    report_id,
    s3_key,
    status || "active"
  );
};

const getById = async (uid) => {
  if (!uid) {
    logger.error("UID is required for attachment retrieval");
    throw new ValidationError("UID is required");
  }
  return await findDashboardAttachmentById(uid);
};

const update = async (uid, { report_id, s3_key }) => {
  if (!uid) {
    logger.error("UID is required for attachment update");
    throw new ValidationError("UID is required");
  }
  const updates = {};
  if (report_id !== undefined) updates.report_id = report_id;
  if (s3_key !== undefined) updates.s3_key = s3_key;
  if (Object.keys(updates).length === 0) {
    logger.error("No updates provided for attachment");
    throw new ValidationError("No updates provided");
  }
  return await updateDashboardAttachment(uid, updates);
};

const remove = async (uid) => {
  if (!uid) {
    logger.error("UID is required for attachment deletion");
    throw new ValidationError("UID is required");
  }
  return await deleteDashboardAttachment(uid);
};

const getByReportId = async (report_id) => {
  if (!report_id) {
    logger.error("Report ID is required for attachment retrieval");
    throw new ValidationError("Report ID is required");
  }
  return await findDashboardAttachmentByReportId(report_id);
};

module.exports = { create, getById, update, remove, getByReportId };
