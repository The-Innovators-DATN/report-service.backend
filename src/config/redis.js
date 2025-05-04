const Redis = require("ioredis");
const retry = require("async-retry");
const logger = require("./logger");

// create redis client with ioredis
const client = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  db: process.env.REDIS_DB || 0,
  maxRetriesPerRequest: null, // required for bullmq compatibility
});

client.on("error", (err) => logger.error("Redis error:", err));

const connectWithRetry = async () => {
  await retry(
    async () => {
      await client.ping(); // ioredis uses ping to test connection
      logger.info("Connected to Redis");
    },
    {
      retries: 5,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 10000,
      onRetry: (err, attempt) => {
        logger.warn(
          `Redis connection attempt ${attempt} failed: ${err.message}. Retrying...`
        );
      },
    }
  );
};

module.exports = { client, connectWithRetry };
