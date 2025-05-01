const { createClient } = require("redis");
const retry = require("async-retry");
const logger = require("./logger");

const client = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

client.on("error", (err) => logger.error("Redis error:", err));

const connectWithRetry = async () => {
  await retry(
    async () => {
      await client.connect();
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
