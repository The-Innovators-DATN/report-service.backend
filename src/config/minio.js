const { S3Client, ListBucketsCommand } = require("@aws-sdk/client-s3");
const retry = require("async-retry");
const logger = require("./logger");

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

const connectWithRetry = async () => {
  await retry(
    async () => {
      await s3Client.send(new ListBucketsCommand({}));
      logger.info(
        `Connected to MinIO, using bucket: ${process.env.S3_REPORT_BUCKET}`
      );
    },
    {
      retries: 5,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 10000,
      onRetry: (err, attempt) => {
        logger.warn(
          `MinIO connection attempt ${attempt} failed: ${err.message}. Retrying...`
        );
      },
    }
  );
};

module.exports = {
  s3Client,
  bucket: process.env.S3_REPORT_BUCKET,
  connectWithRetry,
};
