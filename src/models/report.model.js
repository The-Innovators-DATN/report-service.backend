const { log } = require("winston");
const { pgPool } = require("../config/database");
const logger = require("../config/logger");

const createScheduleReport = async (
  id,
  template_id,
  cron_expr,
  timezone,
  pre_gen_offset_min,
  title,
  recipients, // Now accepts a comma-separated string or array
  user_id,
  status
) => {
  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");
    const recipientsValue = Array.isArray(recipients) ? recipients.join(',') : recipients;
    const query = `INSERT INTO schedule_report (id, template_id, cron_expr, timezone, pre_gen_offset_min, title, recipients, user_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`;
    const result = await client.query(query, [
      id || uuidv4(),
      template_id,
      cron_expr,
      timezone,
      pre_gen_offset_min,
      title,
      recipientsValue,
      user_id,
      status || "active",
    ]);
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw new Error(`Failed to create schedule report: ${error.message}`);
  } finally {
    client.release();
  }
};

const findScheduleReportById = async (id) => {
  const query = `SELECT * FROM schedule_report WHERE id = $1 AND status = 'active'`;
  const result = await pgPool.query(query, [id]);
  return result.rows[0] || null;
};

const updateScheduleReport = async (id, updates) => {
  if (!id) throw new Error("ID is required");
  if (Object.keys(updates).length === 0) return null;
  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");
    const setClauses = [];
    const values = [];
    let index = 1;
    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`${key} = $${index}`);
      values.push(value);
      index++;
    }
    values.push(id);
    const query = `UPDATE schedule_report SET ${setClauses.join(
      ", "
    )}, updated_at = NOW() WHERE id = $${index} AND status = 'active' RETURNING *`;
    const result = await client.query(query, values);
    await client.query("COMMIT");
    return result.rows[0] || null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw new Error(`Failed to update schedule report: ${error.message}`);
  }
  finally {
    client.release();
  }
};

const deleteScheduleReport = async (id) => {
  try {
    logger.info(`Deleting schedule report with ID ${id}`);
    const query = `UPDATE schedule_report SET status = 'deleted' WHERE id = $1 AND status = 'active' RETURNING *`;
    const result = await pgPool.query(query, [id]);
    return result.rows[0] || null;
  }
  catch (error) {
    throw new Error(`Failed to delete schedule report: ${error.message}`);
  }
};

const findScheduleReportByUserId = async (user_id) => {
  const query = `SELECT * FROM schedule_report WHERE user_id = $1 AND status = 'active'`;
  const result = await pgPool.query(query, [user_id]);
  return result.rows;
};

module.exports = {
  createScheduleReport,
  findScheduleReportById,
  updateScheduleReport,
  deleteScheduleReport,
  findScheduleReportByUserId,
};
