const { v4: uuidv4 } = require("uuid");
const {
  createScheduleReport,
  findScheduleReportById,
  updateScheduleReport,
  deleteScheduleReport,
  findScheduleReportByUserId,
} = require("../models/report.model");
const { reportGenerationQueue, emailSendingQueue } = require("../queue");
const logger = require("../config/logger");
const moment = require("moment-timezone");

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const create = async ({
  template_id,
  cron_expr,
  timezone,
  pre_gen_offset_min,
  title,
  recipients,
  user_id,
  status,
}) => {
  if (!template_id || !cron_expr || !user_id) {
    logger.error("Missing required fields for report creation");
    throw new ValidationError(
      "Missing required fields: template_id, cron_expr, user_id"
    );
  }
  if (!/^\S+@\S+\.\S+$/.test(recipients)) {
    logger.error("Invalid email format for recipients");
    throw new ValidationError("Invalid email format for recipients");
  }
  const id = uuidv4();
  const report = await createScheduleReport(
    id,
    template_id,
    cron_expr,
    timezone,
    pre_gen_offset_min,
    title,
    recipients,
    user_id,
    status || "active"
  );

  const {
    findScheduleReportTemplateById,
  } = require("../models/template.model");
  const template = await findScheduleReportTemplateById(template_id);
  if (!template) {
    logger.error(`template ${template_id} not found for report ${id}`);
    throw new ValidationError("Template not found");
  }

  const generationTime = moment()
    .tz(timezone)
    .subtract(pre_gen_offset_min || 0, "minutes")
    .valueOf();
  await reportGenerationQueue.add(
    `generate-report-${id}`,
    {
      reportId: id,
      title,
      dashboardLayout: template.dashboard_layout,
    },
    {
      delay: Math.max(0, generationTime - Date.now()),
      jobId: `generate-report-${id}`,
    }
  );
  logger.info(
    `scheduled report generation for report ${id} at ${new Date(
      generationTime
    )}`
  );

  await emailSendingQueue.add(
    `send-email-${id}`,
    {
      reportId: id,
      title,
      recipients,
      s3Key: "",
      historyUid: null, // will be set by the emailWorker on first attempt
    },
    {
      repeat: {
        cron: cron_expr,
        tz: timezone,
      },
      jobId: `send-email-${id}`,
    }
  );
  logger.info(
    `scheduled email sending for report ${id} with cron ${cron_expr}`
  );

  return report;
};

const getById = async (id) => {
  if (!id) {
    logger.error("ID is required for report retrieval");
    throw new ValidationError("ID is required");
  }
  return await findScheduleReportById(id);
};

const update = async (id, updates) => {
  if (!id) {
    logger.error("ID is required for report update");
    throw new ValidationError("ID is required");
  }
  if (Object.keys(updates).length === 0) {
    logger.error("No updates provided for report");
    throw new ValidationError("No updates provided");
  }
  if (updates.recipients && !/^\S+@\S+\.\S+$/.test(updates.recipients)) {
    logger.error("Invalid email format for recipients update");
    throw new ValidationError("Invalid email format for recipients");
  }

  if (updates.cron_expr || updates.timezone) {
    const report = await findScheduleReportById(id);
    if (!report) {
      logger.error(`report ${id} not found for update`);
      throw new ValidationError("Report not found");
    }
    await emailSendingQueue.removeRepeatable(`send-email-${id}`);
    await emailSendingQueue.add(
      `send-email-${id}`,
      {
        reportId: id,
        title: report.title,
        recipients: report.recipients,
        s3Key: "",
        historyUid: null,
      },
      {
        repeat: {
          cron: updates.cron_expr || report.cron_expr,
          tz: updates.timezone || report.timezone,
        },
        jobId: `send-email-${id}`,
      }
    );
    logger.info(`rescheduled email sending for report ${id} with updated cron`);
  }

  return await updateScheduleReport(id, updates);
};

const remove = async (id) => {
  if (!id) {
    logger.error("ID is required for report deletion");
    throw new ValidationError("ID is required");
  }
  await reportGenerationQueue.remove(`generate-report-${id}`);
  await emailSendingQueue.removeRepeatable(`send-email-${id}`);
  logger.info(`removed scheduled jobs for report ${id}`);
  return await deleteScheduleReport(id);
};

const getByUserId = async (user_id) => {
  if (!user_id) {
    logger.error("User ID is required for report retrieval");
    throw new ValidationError("User ID is required");
  }
  return await findScheduleReportByUserId(user_id);
};

module.exports = { create, getById, update, remove, getByUserId };
