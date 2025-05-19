const { Queue, Worker } = require("bullmq");
const { client: redisClient } = require("../config/redis");
const { s3Client, bucket } = require("../config/minio");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { transporter } = require("../config/mailer");
const logger = require("../config/logger");
const {
  createReportHistory,
  updateReportHistory,
} = require("../models/report-history.model");
const { findScheduleReportById } = require("../models/report.model");
const {
  findDashboardAttachmentByReportId,
} = require("../models/attachment.model");
const Piscina = require("piscina");
const fs = require("fs").promises; // For reading the HTML template file
const path = require("path");

// Create a thread pool for report generation
const reportGenerationPool = new Piscina({
  filename: __dirname + "/../workers/report-generator.worker.js",
  maxThreads: 5,
});

// Setup queues for report generation and email sending
const reportGenerationQueue = new Queue("report-generation", {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});
const emailSendingQueue = new Queue("email-sending", {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});

// Worker for generating reports (PDF) using thread pool
const reportWorker = new Worker(
  "report-generation",
  async (job) => {
    const { reportId, title, dashboardLayout } = job.data;
    logger.info(
      `main thread: starting PDF generation for report ${reportId}, attempt ${
        job.attemptsMade + 1
      }`
    );

    try {
      const result = await reportGenerationPool.run({
        reportId,
        title,
        dashboardLayout,
      });
      logger.info(
        `main thread: PDF generation succeeded for report ${reportId}`
      );
      return { s3Key: result.s3Key };
    } catch (err) {
      logger.error(
        `main thread: PDF generation failed for report ${reportId}: ${err.message}`
      );
      throw err;
    }
  },
  {
    connection: redisClient,
    concurrency: 5,
    maxStalledCount: 3,
    stalledInterval: 30000,
  }
);

// Worker for sending emails (handles cron-based jobs automatically)
const emailWorker = new Worker(
  "email-sending",
  async (job) => {
    const { reportId, title, recipients, historyUid } = job.data;
    const attempt = job.attemptsMade + 1;
    logger.info(
      `sending email for report ${reportId} to ${recipients}, attempt ${attempt}`
    );

    try {
      // Fetch report from DB
      const report = await findScheduleReportById(reportId);
      if (!report) {
        throw new Error(`report ${reportId} not found`);
      }

      // Fetch s3Key from dashboard_attachment
      const attachments = await findDashboardAttachmentByReportId(reportId);
      if (!attachments || attachments.length === 0) {
        throw new Error(`No active attachment found for report ${reportId}`);
      }
      const s3Key = attachments[0].s3_key;
      if (!s3Key) {
        throw new Error(`No s3Key found in attachment for report ${reportId}`);
      }

      const downloadParams = {
        Bucket: bucket,
        Key: s3Key,
      };

      const { Body } = await s3Client.send(
        new GetObjectCommand(downloadParams)
      );
      const pdfBuffer = await streamToBuffer(Body);

      // Load the HTML template (updated path)
      const templatePath = path.join(
        __dirname,
        "../templates/water-report-email-template.html"
      );
      let htmlContent;
      try {
        htmlContent = await fs.readFile(templatePath, "utf-8");
      } catch (templateError) {
        logger.error(`Failed to read email template: ${templateError.message}`);
        throw new Error(
          `Failed to load email template: ${templateError.message}`
        );
      }

      // Replace placeholders with dynamic values
      const recipientName = recipients.split("@")[0]; // Simple extraction, improve as needed
      const generatedDate = new Date().toLocaleDateString();
      htmlContent = htmlContent
        .replace("[Recipient Name]", recipientName)
        .replace("[Report Title]", title)
        .replace("[Report ID]", reportId)
        .replace("[Generated Date]", generatedDate);

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USERNAME}>`,
        to: recipients,
        subject: `Water Report: ${title}`,
        html: htmlContent,
        text: `Attached is your scheduled water report: ${title}`,
        attachments: [
          {
            filename: `${title}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      };

      // Send email
      await transporter.sendMail(mailOptions);
      logger.info(`email sent for report ${reportId} to ${recipients}`);

      // Attempt to create/update report history, but don't fail the job if it errors
      try {
        if (attempt === 1) {
          const history = await createReportHistory(
            reportId,
            report.user_id,
            recipients,
            attachments[0].uid,
            "success",
            attempt,
            null,
            new Date()
          );
          job.data.historyUid = history.uid;
        } else {
          await updateReportHistory(historyUid, {
            status: "success",
            attempt,
            sent_at: new Date(),
          });
        }
      } catch (historyError) {
        logger.error(
          `failed to record report history for report ${reportId}: ${historyError.message}`
        );
      }

      return { status: "success" };
    } catch (err) {
      logger.error(
        `failed to send email for report ${reportId} on attempt ${attempt}: ${err.message}`
      );

      const report = await findScheduleReportById(reportId);
      const user_id = report ? report.user_id : null;
      const status = attempt < 3 ? "retrying" : "failed";

      try {
        if (attempt === 1) {
          const history = await createReportHistory(
            reportId,
            user_id,
            recipients,
            null,
            status,
            attempt,
            err.message,
            null
          );
          job.data.historyUid = history.uid;
        } else {
          await updateReportHistory(historyUid, {
            status,
            attempt,
            error_message: err.message,
            sent_at: null,
          });
        }
      } catch (historyError) {
        logger.error(
          `failed to record failure history for report ${reportId}: ${historyError.message}`
        );
      }

      throw err;
    }
  },
  {
    connection: redisClient,
    concurrency: 3,
    maxStalledCount: 3,
    stalledInterval: 30000,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    },
  }
);

// Helper to convert S3 stream to buffer
const streamToBuffer = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

// Monitor queue lengths and log them every 5 minutes
const monitorQueues = async () => {
  const reportQueueStats = await reportGenerationQueue.getJobCounts();
  const emailQueueStats = await emailSendingQueue.getJobCounts();
  logger.info(
    `report queue - waiting: ${reportQueueStats.waiting}, active: ${reportQueueStats.active}`
  );
  logger.info(
    `email queue - waiting: ${emailQueueStats.waiting}, active: ${emailQueueStats.active}`
  );
};

setInterval(monitorQueues, 5 * 60 * 1000);

// Handle worker errors
reportWorker.on("failed", (job, err) => {
  if (job.attemptsMade >= 3) {
    logger.error(
      `report generation job ${job.id} failed after 3 attempts: ${err.message}`
    );
  } else {
    logger.warn(
      `report generation job ${job.id} failed, retrying (${job.attemptsMade}/3): ${err.message}`
    );
  }
});

emailWorker.on("failed", (job, err) => {
  if (job.attemptsMade >= 3) {
    logger.error(
      `email sending job ${job.id} failed after 3 attempts: ${err.message}`
    );
  } else {
    logger.warn(
      `email sending job ${job.id} failed, retrying (${job.attemptsMade}/3): ${err.message}`
    );
  }
});

// Handle stalled jobs
reportWorker.on("stalled", (jobId) => {
  logger.warn(`report generation job ${jobId} stalled`);
});

emailWorker.on("stalled", (jobId) => {
  logger.warn(`email sending job ${jobId} stalled`);
});

module.exports = { reportGenerationQueue, emailSendingQueue };
