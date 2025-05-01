const nodemailer = require("nodemailer");
const retry = require("async-retry");
const logger = require("./logger");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_SERVER,
  port: process.env.EMAIL_SMTP_PORT,
  secure: false,
  pool: true,
  maxConnections: 10,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const connectWithRetry = async () => {
  await retry(
    async () => {
      await transporter.verify();
      logger.info("Connected to SMTP server");
    },
    {
      retries: 5,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 10000,
      onRetry: (err, attempt) => {
        logger.warn(
          `SMTP connection attempt ${attempt} failed: ${err.message}. Retrying...`
        );
      },
    }
  );
};

module.exports = { transporter, connectWithRetry };
