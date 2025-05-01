const {
  getReportHistoryWithPagination,
} = require("../models/report_history.model");
const logger = require("../config/logger");

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const getHistoryWithPagination = async (filters, page, limit) => {
  if (!page || page < 1) {
    logger.error("page must be a positive integer");
    throw new ValidationError("page must be a positive integer");
  }
  if (!limit || limit < 1) {
    logger.error("limit must be a positive integer");
    throw new ValidationError("limit must be a positive integer");
  }
  return await getReportHistoryWithPagination(filters, page, limit);
};

module.exports = { getHistoryWithPagination };
