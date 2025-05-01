const attachmentService = require("../services/attachment.service");
const logger = require("../config/logger");
const { successResponse, errorResponse } = require("../utils/response.util");

const create = async (req, res) => {
  try {
    const newAttachment = await attachmentService.create(req.body);
    logger.info(`Created dashboard attachment with UID ${newAttachment.uid}`);
    return successResponse(
      res,
      "Dashboard attachment created successfully",
      newAttachment,
      201
    );
  } catch (err) {
    if (err.name === "ValidationError") {
      return errorResponse(res, err.message, 400);
    }
    logger.error(`Failed to create dashboard attachment: ${err.message}`);
    return errorResponse(res, "Failed to create dashboard attachment", 500, {
      error: err.message,
    });
  }
};

const get = async (req, res) => {
  const { uid } = req.params;

  try {
    const attachment = await attachmentService.getById(uid);
    if (!attachment) {
      logger.warn(`Dashboard attachment not found or inactive: ${uid}`);
      return errorResponse(
        res,
        "Dashboard attachment not found or inactive",
        404
      );
    }
    return successResponse(
      res,
      "Dashboard attachment retrieved successfully",
      attachment
    );
  } catch (err) {
    logger.error(`Failed to retrieve dashboard attachment: ${err.message}`);
    return errorResponse(res, "Failed to retrieve dashboard attachment", 500, {
      error: err.message,
    });
  }
};

const update = async (req, res) => {
  const { uid } = req.params;
  const { report_id, s3_key } = req.body;

  try {
    const updatedAttachment = await attachmentService.update(uid, {
      report_id,
      s3_key,
    });
    if (!updatedAttachment) {
      logger.warn(`Dashboard attachment not found or inactive: ${uid}`);
      return errorResponse(
        res,
        "Dashboard attachment not found or inactive",
        404
      );
    }
    logger.info(`Updated dashboard attachment with UID ${uid}`);
    return successResponse(
      res,
      "Dashboard attachment updated successfully",
      updatedAttachment
    );
  } catch (err) {
    if (err.name === "ValidationError") {
      return errorResponse(res, err.message, 400);
    }
    logger.error(`Failed to update dashboard attachment: ${err.message}`);
    return errorResponse(res, "Failed to update dashboard attachment", 500, {
      error: err.message,
    });
  }
};

const remove = async (req, res) => {
  const { uid } = req.params;

  try {
    const deletedAttachment = await attachmentService.remove(uid);
    if (!deletedAttachment) {
      logger.warn(`Dashboard attachment not found or inactive: ${uid}`);
      return errorResponse(
        res,
        "Dashboard attachment not found or inactive",
        404
      );
    }
    logger.info(`Soft-deleted dashboard attachment with UID ${uid}`);
    return successResponse(
      res,
      "Dashboard attachment soft-deleted successfully",
      {}
    );
  } catch (err) {
    logger.error(`Failed to soft-delete dashboard attachment: ${err.message}`);
    return errorResponse(
      res,
      "Failed to soft-delete dashboard attachment",
      500,
      { error: err.message }
    );
  }
};

const getByReportId = async (req, res) => {
  const { report_id } = req.params;

  try {
    const attachments = await attachmentService.getByReportId(report_id);
    return successResponse(
      res,
      "Dashboard attachments retrieved successfully",
      attachments
    );
  } catch (err) {
    logger.error(
      `Failed to retrieve dashboard attachments for report ${report_id}: ${err.message}`
    );
    return errorResponse(res, "Failed to retrieve dashboard attachments", 500, {
      error: err.message,
    });
  }
};

module.exports = {
  createDashboardAttachment: create,
  getDashboardAttachment: get,
  updateDashboardAttachment: update,
  deleteDashboardAttachment: remove,
  getDashboardAttachmentsByReportId: getByReportId,
};
