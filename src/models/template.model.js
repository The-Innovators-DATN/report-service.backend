const { pgPool } = require("../config/database");

const createScheduleReportTemplate = async (
  id,
  user_id,
  description,
  dashboard_layout,
  status
) => {
  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");
    const query = `INSERT INTO schedule_report_template (id, user_id, description, dashboard_layout, status) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    const result = await client.query(query, [
      id || uuidv4(),
      user_id,
      description,
      dashboard_layout,
      status || "active",
    ]);
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw new Error(`Failed to create schedule report template: ${error.message}`);
  } finally {
    client.release();
  }
};
  
const findScheduleReportTemplateById = async (id) => {
  const query = `SELECT * FROM schedule_report_template WHERE id = $1 AND status = 'active'`;
  const result = await pgPool.query(query, [id]);
  return result.rows[0] || null;
};

const updateScheduleReportTemplate = async (id, updates) => {
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
    const query = `UPDATE schedule_report_template SET ${setClauses.join(
      ", "
    )}, updated_at = NOW() WHERE id = $${index} AND status = 'active' RETURNING *`;
    const result = await pgPool.query(query, values);
    return result.rows[0] || null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw new Error(`Failed to update schedule report template: ${error.message}`);
  } finally {
    client.release();
  }
};

const deleteScheduleReportTemplate = async (id) => {
  const query = `UPDATE schedule_report_template SET status = 'inactive', updated_at = NOW() WHERE id = $1 AND status = 'active' RETURNING *`;
  const result = await pgPool.query(query, [id]);
  return result.rows[0] || null;
};

const findScheduleReportTemplateByUserId = async (user_id) => {
  const query = `SELECT * FROM schedule_report_template WHERE user_id = $1 AND status = 'active'`;
  const result = await pgPool.query(query, [user_id]);
  return result.rows;
};

module.exports = {
  createScheduleReportTemplate,
  findScheduleReportTemplateById,
  updateScheduleReportTemplate,
  deleteScheduleReportTemplate,
  findScheduleReportTemplateByUserId,
};
