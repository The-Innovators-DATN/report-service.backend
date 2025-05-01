require("dotenv").config();
const express = require("express");
const logger = require("./src/config/logger");
const {
  pgPool,
  connectWithRetry: connectPg,
} = require("./src/config/database");
const {
  s3Client,
  bucket,
  connectWithRetry: connectMinIO,
} = require("./src/config/minio");
const {
  client: redisClient,
  connectWithRetry: connectRedis,
} = require("./src/config/redis");
const {
  transporter,
  connectWithRetry: connectMailer,
} = require("./src/config/mailer");
const routes = require("./src/routes/index.route");
const errorHandler = require("./src/middlewares/error.handler");

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Setup routes
app.use("/", routes);

// Error handling middleware
app.use(errorHandler);

// Start the server after all connections are established
const startServer = async () => {
  try {
    await connectPg();
    await connectRedis();
    await connectMinIO();
    await connectMailer();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      logger.info(
        `Server running on port ${PORT} in ${process.env.NODE_ENV} mode`
      );
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  logger.info("SIGTERM received. Closing server...");
  await pgPool.end();
  await redisClient.quit();
  transporter.close();
  process.exit(0);
};

// Start the application
startServer();

// Handle termination signals
process.on("SIGTERM", shutdown);
