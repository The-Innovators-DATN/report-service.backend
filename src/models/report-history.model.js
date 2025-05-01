const { pgPool } = require("../config/database");

const createReportHistory = async (
  report_id,
  user_id,
  recipients,
  attachment_id,
  status,
  attempt,
  error_message,
  sent_at
) => {
  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");
    const query = `INSERT INTO report_history (report_id, user_id, recipients, attachment_id, status, attempt, error_message, sent_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
    const result = await client.query(query, [
      report_id,
      user_id,
      recipients,
      attachment_id || null,
      status,
      attempt,
      error_message || null,
      sent_at || null,
    ]);
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw new Error(`failed to create report history: ${error.message}`);
  } finally {
    client.release();
  }
};

const updateReportHistory = async (uid, updates) => {
  if (!uid) throw new Error("uid is required");
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
    values.push(uid);

    const query = `UPDATE report_history SET ${setClauses.join(
      ", "
    )}, created_at = NOW() WHERE uid = $${index} RETURNING *`;
    const result = await client.query(query, values);
    await client.query("COMMIT");
    return result.rows[0] || null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw new Error(`failed to update report history: ${error.message}`);
  } finally {
    client.release();
  }
};

const getReportHistoryWithPagination = async (
  filters,
  page = 1,
  limit = 50
) => {
  const offset = (page - 1) * limit;
  let query = `SELECT * FROM report_history WHERE 1=1`;
  const values = [];
  let paramIndex = 1;

  if (filters.uid) {
    query += ` AND uid = $${paramIndex}`;
    values.push(filters.uid);
    paramIndex++;
  }
  if (filters.report_id) {
    query += ` AND report_id = $${paramIndex}`;
    values.push(filters.report_id);
    paramIndex++;
  }
  if (filters.user_id) {
    query += ` AND user_id = $${paramIndex}`;
    values.push(filters.user_id);
    paramIndex++;
  }
  if (filters.recipients) {
    query += ` AND recipients ILIKE $${paramIndex}`;
    values.push(`%${filters.recipients}%`);
    paramIndex++;
  }
  if (filters.attachment_id) {
    query += ` AND attachment_id = $${paramIndex}`;
    values.push(filters.attachment_id);
    paramIndex++;
  }
  if (filters.status) {
    query += ` AND status = $${paramIndex}`;
    values.push(filters.status);
    paramIndex++;
  }
  if (filters.attempt) {
    query += ` AND attempt = $${paramIndex}`;
    values.push(filters.attempt);
    paramIndex++;
  }
  if (filters.error_message) {
    query += ` AND error_message ILIKE $${paramIndex}`;
    values.push(`%${filters.error_message}%`);
    paramIndex++;
  }
  if (filters.sent_at) {
    query += ` AND sent_at = $${paramIndex}`;
    values.push(filters.sent_at);
    paramIndex++;
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${
    paramIndex + 1
  }`;
  values.push(limit, offset);

  const result = await pgPool.query(query, values);

  const countQuery = `SELECT COUNT(*) FROM report_history WHERE 1=1`;
  const countValues = values.slice(0, -2);
  const countResult = await pgPool.query(
    countQuery + query.split("WHERE 1=1")[1].split("ORDER BY")[0],
    countValues
  );

  return {
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(countResult.rows[0].count),
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    },
  };
};

module.exports = {
  createReportHistory,
  updateReportHistory,
  getReportHistoryWithPagination,
};
