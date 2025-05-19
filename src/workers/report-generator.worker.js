const puppeteer = require("puppeteer");
const { s3Client, bucket } = require("../config/minio");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const attachmentService = require("../services/attachment.service");

module.exports = async ({ reportId, title, dashboardLayout }) => {
  console.log(`worker thread: generating PDF for report ${reportId}`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Construct the dashboard URL using the dashboardLayout UUID
  const dashboardUrl = `https://dreamoria.net/dashboard/${dashboardLayout}`;

  try {
    // Navigate to the dashboard URL
    await page.goto(dashboardUrl, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait for a specific element to ensure content is loaded
    await page
      .waitForSelector(".highcharts-container", { timeout: 10000 })
      .catch(() =>
        console.warn(
          `worker thread: chart container not found for report ${reportId}, proceeding anyway`
        )
      );

    // Generate PDF from the loaded page
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    });

    // Upload PDF to S3
    const s3Key = `reports/${reportId}/${Date.now()}.pdf`;
    const uploadParams = {
      Bucket: bucket,
      Key: s3Key,
      Body: pdfBuffer,
      ContentType: "application/pdf",
    };

    await s3Client.send(new PutObjectCommand(uploadParams));
    console.log(
      `worker thread: uploaded PDF to S3 for report ${reportId} at ${s3Key}`
    );

    console.log(`Saving attachment for report ${reportId} with s3Key ${s3Key}`);
    const existingAttachments = await attachmentService.getByReportId(reportId);
    if (existingAttachments.length > 0) {
      console.log(
        `Updating attachment ${existingAttachments[0].uid} with new s3Key ${s3Key}`
      );
      await attachmentService.update(existingAttachments[0].uid, {
        s3_key: s3Key,
      });
    } else {
      console.log(
        `Creating new attachment for report ${reportId} with s3Key ${s3Key}`
      );
      await attachmentService.create({
        report_id: reportId,
        s3_key: s3Key,
        status: "active",
      });
    }

    return { s3Key };
  } catch (error) {
    console.error(
      `worker thread: failed to generate PDF for report ${reportId}: ${error.message}`
    );
    throw error;
  } finally {
    await browser.close();
  }
};
