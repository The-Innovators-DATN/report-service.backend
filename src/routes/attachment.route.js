const {
  createDashboardAttachmentValidation,
  updateDashboardAttachmentValidation,
  findByReportIdValidation,
  validateDashboardAttachment,
} = require("../validates/attachment.validate");

const {
  createDashboardAttachment,
  getDashboardAttachment,
  updateDashboardAttachment,
  deleteDashboardAttachment,
  getDashboardAttachmentsByReportId,
} = require("../controllers/attachment.controller");

module.exports = (router, PATH_API) => {
  router.post(
    `${PATH_API}/dashboard-attachments`,
    createDashboardAttachmentValidation,
    validateDashboardAttachment,
    createDashboardAttachment
  );
  router.get(`${PATH_API}/dashboard-attachments/:uid`, getDashboardAttachment);
  router.get(
    `${PATH_API}/dashboard-attachments/report/:report_id`,
    findByReportIdValidation,
    validateDashboardAttachment,
    getDashboardAttachmentsByReportId
  );
  router.put(
    `${PATH_API}/dashboard-attachments/:uid`,
    updateDashboardAttachmentValidation,
    validateDashboardAttachment,
    updateDashboardAttachment
  );
  router.delete(
    `${PATH_API}/dashboard-attachments/:uid`,
    deleteDashboardAttachment
  );
};
