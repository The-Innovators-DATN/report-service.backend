const { pgPool } = require("../config/database");

const createDashboardAttachment = async (uid, report_id, s3_key, status) => {
  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");
    const query = `INSERT INTO dashboard_attachment (uid, report_id, s3_key, status) VALUES ($1, $2, $3, $4) RETURNING *`;
    const result = await client.query(query, [
      uid || uuidv4(),
      report_id,
      s3_key,
      status || "active",
    ]);
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw new Error(`Failed to create attachment: ${error.message}`);
  } finally {
    client.release();
  }
};

const findDashboardAttachmentById = async (uid) => {
  const query = `SELECT * FROM dashboard_attachment WHERE uid = $1 AND status = 'active'`;
  const result = await pgPool.query(query, [uid]);
  return result.rows[0] || null;
};

const updateDashboardAttachment = async (uid, updates) => {
  if (!uid) throw new Error("UID is required");
  if (Object.keys(updates).length === 0) throw new Error("No updates provided");
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
    const query = `UPDATE dashboard_attachment SET ${setClauses.join(
      ", "
    )}, updated_at = NOW() WHERE uid = $${index} AND status = 'active' RETURNING *`;
    const result = await client.query(query, values);
    await client.query("COMMIT");
    return result.rows[0] || null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw new Error(`Failed to update attachment: ${error.message}`);
  } finally {
    client.release();
  }
};

const deleteDashboardAttachment = async (uid) => {
  const query = `UPDATE dashboard_attachment SET status = 'inactive', updated_at = NOW() WHERE uid = $1 AND status = 'active' RETURNING *`;
  const result = await pgPool.query(query, [uid]);
  return result.rows[0] || null;
};

const findDashboardAttachmentByReportId = async (report_id) => {
  const query = `SELECT * FROM dashboard_attachment WHERE report_id = $1 AND status = 'active'`;
  const result = await pgPool.query(query, [report_id]);
  return result.rows;
};

module.exports = {
  createDashboardAttachment,
  findDashboardAttachmentById,
  updateDashboardAttachment,
  deleteDashboardAttachment,
  findDashboardAttachmentByReportId,
};
