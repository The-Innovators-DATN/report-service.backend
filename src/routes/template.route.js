const {
  createScheduleReportTemplateValidation,
  updateScheduleReportTemplateValidation,
  findByUserIdValidation: findScheduleReportTemplateByUserIdValidation,
  validateScheduleReportTemplate,
} = require("../validates/template.validate");

const {
  createScheduleReportTemplate,
  getScheduleReportTemplate,
  updateScheduleReportTemplate,
  deleteScheduleReportTemplate,
  getScheduleReportTemplatesByUserId,
} = require("../controllers/template.controller");

module.exports = (router, PATH_API) => {
  router.post(
    `${PATH_API}/schedule-report-templates`,
    createScheduleReportTemplateValidation,
    validateScheduleReportTemplate,
    createScheduleReportTemplate
  );
  router.get(
    `${PATH_API}/schedule-report-templates/:id`,
    getScheduleReportTemplate
  );
  router.get(
    `${PATH_API}/schedule-report-templates/user/:user_id`,
    findScheduleReportTemplateByUserIdValidation,
    validateScheduleReportTemplate,
    getScheduleReportTemplatesByUserId
  );
  router.put(
    `${PATH_API}/schedule-report-templates/:id`,
    updateScheduleReportTemplateValidation,
    validateScheduleReportTemplate,
    updateScheduleReportTemplate
  );
  router.delete(
    `${PATH_API}/schedule-report-templates/:id`,
    deleteScheduleReportTemplate
  );
};
