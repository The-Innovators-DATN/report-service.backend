const {
  createScheduleReportValidation,
  updateScheduleReportValidation,
  findByUserIdValidation: findScheduleReportByUserIdValidation,
  validateScheduleReport,
} = require("../validates/report.validate");

const {
  createScheduleReport,
  getScheduleReport,
  updateScheduleReport,
  deleteScheduleReport,
  getScheduleReportsByUserId,
} = require("../controllers/report.controller");

module.exports = (router, PATH_API) => {
  router.post(
    `${PATH_API}/schedule-reports`,
    createScheduleReportValidation,
    validateScheduleReport,
    createScheduleReport
  );
  router.get(`${PATH_API}/schedule-reports/:id`, getScheduleReport);
  router.get(
    `${PATH_API}/schedule-reports/user/:user_id`,
    findScheduleReportByUserIdValidation,
    validateScheduleReport,
    getScheduleReportsByUserId
  );
  router.put(
    `${PATH_API}/schedule-reports/:id`,
    updateScheduleReportValidation,
    validateScheduleReport,
    updateScheduleReport
  );
  router.delete(`${PATH_API}/schedule-reports/:id`, deleteScheduleReport);
};
