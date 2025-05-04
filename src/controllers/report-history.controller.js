const {
  getHistoryWithPagination,
  update,
} = require("../services/report-history.service");
const { successResponse, errorResponse } = require("../utils/response.util");

const getReportHistory = async (req, res) => {
  try {
    const { page, limit, ...filters } = req.query;
    const result = await getHistoryWithPagination(filters, page, limit);
    return successResponse(res, "report history retrieved", result);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const updateReportHistory = async (req, res) => {
  try {
    const { uid } = req.params;
    const updates = req.body;
    const result = await update(uid, updates);
    if (!result) {
      return errorResponse(res, "report history not found", 404);
    }
    return successResponse(res, "report history updated", result);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

module.exports = { getReportHistory, updateReportHistory };
