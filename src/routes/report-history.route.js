const {
  getReportHistoryValidation,
  validateReportHistory,
} = require("../validates/report-history.validate");
const {
  getReportHistory,
} = require("../controllers/report-history.controller");

module.exports = (router, PATH_API) => {
  router.get(
    `${PATH_API}/report-history`,
    getReportHistoryValidation,
    validateReportHistory,
    getReportHistory
  );
};
