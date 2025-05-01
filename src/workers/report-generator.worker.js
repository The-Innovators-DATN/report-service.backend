const puppeteer = require("puppeteer");
const { s3Client, bucket } = require("../config/minio");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

module.exports = async ({ reportId, title, dashboardLayout }) => {
  console.log(`worker thread: generating PDF for report ${reportId}`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(dashboardLayout || "<h1>No content provided</h1>");
  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();

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

  return { s3Key };
};
