const { Pool } = require("pg");
const retry = require("async-retry");
const logger = require("./logger");

const pgPool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

const connectWithRetry = async () => {
  await retry(
    async () => {
      await pgPool.connect();
      logger.info("Connected to PostgreSQL database");
    },
    {
      retries: 5,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 10000,
      onRetry: (err, attempt) => {
        logger.warn(
          `PostgreSQL connection attempt ${attempt} failed: ${err.message}. Retrying...`
        );
      },
    }
  );
};

module.exports = { pgPool, connectWithRetry };
