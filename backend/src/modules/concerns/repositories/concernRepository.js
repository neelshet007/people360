const db = require('../../../database/db');

/**
 * Concern Repository — Data Access Layer for Concern Communication
 * Parameterized PostgreSQL queries with strict role-based isolation
 */
class ConcernRepository {
  /**
   * Find paginated concerns with joined metadata and role isolation
   */
  async findAll({
    isEmployee = false,
    userId = null,
    employeeId = null,
    category = null,
    status = null,
    priority = null,
    assignedTo = null,
    search = null,
    limit = 50,
    offset = 0,
  } = {}) {
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    // Strict employee isolation: only concerns raised by the user OR about the employee
    if (isEmployee) {
      conditions.push(`(c.raised_by_user_id = $${paramIndex} OR c.subject_employee_id = $${paramIndex + 1})`);
      values.push(userId, employeeId);
      paramIndex += 2;
    }

    if (category) {
      conditions.push(`c.category = $${paramIndex++}`);
      values.push(category);
    }

    if (status) {
      conditions.push(`c.status = $${paramIndex++}`);
      values.push(status);
    }

    if (priority) {
      conditions.push(`c.priority = $${paramIndex++}`);
      values.push(priority);
    }

    if (assignedTo) {
      conditions.push(`c.assigned_to_user_id = $${paramIndex++}`);
      values.push(assignedTo);
    }

    if (search && search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      conditions.push(`(
        c.concern_code ILIKE $${paramIndex} OR 
        c.subject ILIKE $${paramIndex} OR 
        e.first_name ILIKE $${paramIndex} OR 
        e.last_name ILIKE $${paramIndex} OR
        e.employee_code ILIKE $${paramIndex}
      )`);
      values.push(searchPattern);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countSql = `
      SELECT COUNT(*) 
      FROM concerns c
      LEFT JOIN employees e ON c.subject_employee_id = e.id
      ${whereClause};
    `;
    const countRes = await db.query(countSql, values);
    const totalCount = parseInt(countRes.rows[0].count, 10);

    // Data query with subqueries for last message & message count
    values.push(limit, offset);
    const dataSql = `
      SELECT 
        c.id,
        c.concern_code,
        c.raised_by_user_id,
        c.subject_employee_id,
        c.category,
        c.subject,
        c.description,
        c.priority,
        c.status,
        c.assigned_to_user_id,
        c.related_entity_type,
        c.related_entity_id,
        c.resolved_at,
        c.closed_at,
        c.created_at,
        c.updated_at,
        u_raised.name as raised_by_name,
        u_raised.email as raised_by_email,
        u_raised.role as raised_by_role,
        e.employee_code as subject_employee_code,
        e.first_name as subject_first_name,
        e.last_name as subject_last_name,
        e.display_name as subject_display_name,
        e.department as subject_department,
        e.designation as subject_designation,
        u_assigned.name as assigned_to_name,
        u_assigned.email as assigned_to_email,
        (
          SELECT COUNT(*) 
          FROM concern_messages cm 
          WHERE cm.concern_id = c.id 
            ${isEmployee ? 'AND cm.is_internal = false' : ''}
        ) as message_count,
        (
          SELECT MAX(created_at) 
          FROM concern_messages cm 
          WHERE cm.concern_id = c.id 
            ${isEmployee ? 'AND cm.is_internal = false' : ''}
        ) as last_message_at
      FROM concerns c
      JOIN users u_raised ON c.raised_by_user_id = u_raised.id
      JOIN employees e ON c.subject_employee_id = e.id
      LEFT JOIN users u_assigned ON c.assigned_to_user_id = u_assigned.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++};
    `;

    const result = await db.query(dataSql, values);
    return {
      concerns: result.rows,
      totalCount,
      limit,
      offset,
    };
  }

  /**
   * Get KPI summary metrics
   */
  async getMetrics({ isEmployee = false, userId = null, employeeId = null } = {}) {
    const conditions = [];
    const values = [];

    if (isEmployee) {
      conditions.push('(c.raised_by_user_id = $1 OR c.subject_employee_id = $2)');
      values.push(userId, employeeId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE c.status = 'OPEN') as open,
        COUNT(*) FILTER (WHERE c.status = 'UNDER_REVIEW') as under_review,
        COUNT(*) FILTER (WHERE c.status = 'WAITING_FOR_EMPLOYEE') as waiting_for_employee,
        COUNT(*) FILTER (WHERE c.status = 'IN_PROGRESS') as in_progress,
        COUNT(*) FILTER (WHERE c.status = 'RESOLVED') as resolved,
        COUNT(*) FILTER (WHERE c.status = 'CLOSED') as closed,
        COUNT(*) FILTER (WHERE c.priority IN ('HIGH', 'URGENT') AND c.status NOT IN ('RESOLVED', 'CLOSED')) as urgent_high
      FROM concerns c
      ${whereClause};
    `;

    const res = await db.query(sql, values);
    const row = res.rows[0];
    return {
      total: parseInt(row.total, 10),
      open: parseInt(row.open, 10),
      under_review: parseInt(row.under_review, 10),
      waiting_for_employee: parseInt(row.waiting_for_employee, 10),
      in_progress: parseInt(row.in_progress, 10),
      resolved: parseInt(row.resolved, 10),
      closed: parseInt(row.closed, 10),
      urgent_high: parseInt(row.urgent_high, 10),
    };
  }

  /**
   * Find single concern by ID with full author, employee, and assigned info
   */
  async findById(id) {
    const sql = `
      SELECT 
        c.id,
        c.concern_code,
        c.raised_by_user_id,
        c.subject_employee_id,
        c.category,
        c.subject,
        c.description,
        c.priority,
        c.status,
        c.assigned_to_user_id,
        c.related_entity_type,
        c.related_entity_id,
        c.resolved_at,
        c.closed_at,
        c.created_at,
        c.updated_at,
        u_raised.name as raised_by_name,
        u_raised.email as raised_by_email,
        u_raised.role as raised_by_role,
        e.employee_code as subject_employee_code,
        e.first_name as subject_first_name,
        e.last_name as subject_last_name,
        e.display_name as subject_display_name,
        e.department as subject_department,
        e.designation as subject_designation,
        e.email as subject_email,
        u_assigned.name as assigned_to_name,
        u_assigned.email as assigned_to_email
      FROM concerns c
      JOIN users u_raised ON c.raised_by_user_id = u_raised.id
      JOIN employees e ON c.subject_employee_id = e.id
      LEFT JOIN users u_assigned ON c.assigned_to_user_id = u_assigned.id
      WHERE c.id = $1;
    `;
    const res = await db.query(sql, [id]);
    return res.rows[0] || null;
  }

  /**
   * Create a new concern within optional database client transaction
   */
  async create({
    raisedByUserId,
    subjectEmployeeId,
    category,
    subject,
    description,
    priority = 'MEDIUM',
    relatedEntityType = null,
    relatedEntityId = null,
    assignedToUserId = null,
  }, client = null) {
    const runner = client || db;
    const sql = `
      INSERT INTO concerns (
        raised_by_user_id,
        subject_employee_id,
        category,
        subject,
        description,
        priority,
        status,
        assigned_to_user_id,
        related_entity_type,
        related_entity_id
      ) VALUES ($1, $2, $3, $4, $5, $6, 'OPEN', $7, $8, $9)
      RETURNING *;
    `;
    const res = await runner.query(sql, [
      raisedByUserId,
      subjectEmployeeId,
      category,
      subject,
      description,
      priority,
      assignedToUserId,
      relatedEntityType,
      relatedEntityId,
    ]);
    return res.rows[0];
  }

  /**
   * Record a status transition in concern_status_history and update concerns table
   */
  async updateStatus(concernId, fromStatus, toStatus, changedByUserId, comment = null, client = null) {
    const runner = client || db;

    let updateFields = 'status = $1, updated_at = NOW()';
    const params = [toStatus, concernId];

    if (toStatus === 'RESOLVED') {
      updateFields += ', resolved_at = NOW()';
    } else if (toStatus === 'CLOSED') {
      updateFields += ', closed_at = NOW()';
    } else if (toStatus === 'OPEN') {
      updateFields += ', resolved_at = NULL, closed_at = NULL';
    }

    const updateSql = `
      UPDATE concerns 
      SET ${updateFields}
      WHERE id = $2
      RETURNING *;
    `;
    const updatedConcern = await runner.query(updateSql, params);

    // Insert history entry
    const historySql = `
      INSERT INTO concern_status_history (
        concern_id, from_status, to_status, changed_by_user_id, comment
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    await runner.query(historySql, [concernId, fromStatus, toStatus, changedByUserId, comment]);

    return updatedConcern.rows[0];
  }

  /**
   * Assign concern to an HR/Manager user
   */
  async assign(concernId, assignedToUserId, changedByUserId, comment = null, client = null) {
    const runner = client || db;
    const sql = `
      UPDATE concerns 
      SET assigned_to_user_id = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;
    const res = await runner.query(sql, [assignedToUserId, concernId]);

    // Record in history
    const historySql = `
      INSERT INTO concern_status_history (
        concern_id, from_status, to_status, changed_by_user_id, comment
      ) VALUES ($1, res_status.status, res_status.status, $2, $3)
      FROM (SELECT status FROM concerns WHERE id = $1) res_status
      RETURNING *;
    `;
    await runner.query(historySql, [concernId, changedByUserId, comment || `Assigned to user ${assignedToUserId}`]);

    return res.rows[0];
  }

  /**
   * Add message to concern conversation
   */
  async addMessage(concernId, senderUserId, message, isInternal = false) {
    const sql = `
      INSERT INTO concern_messages (
        concern_id, sender_user_id, message, is_internal
      ) VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const res = await db.query(sql, [concernId, senderUserId, message, isInternal]);

    // Touch concern's updated_at
    await db.query('UPDATE concerns SET updated_at = NOW() WHERE id = $1', [concernId]);

    return res.rows[0];
  }

  /**
   * Get messages for a concern (with strict employee filtering for internal notes)
   */
  async getMessages(concernId, { isEmployee = false } = {}) {
    const sql = `
      SELECT 
        cm.id,
        cm.concern_id,
        cm.sender_user_id,
        cm.message,
        cm.is_internal,
        cm.created_at,
        cm.updated_at,
        u.name as sender_name,
        u.email as sender_email,
        u.role as sender_role
      FROM concern_messages cm
      JOIN users u ON cm.sender_user_id = u.id
      WHERE cm.concern_id = $1
        ${isEmployee ? 'AND cm.is_internal = false' : ''}
      ORDER BY cm.created_at ASC;
    `;
    const res = await db.query(sql, [concernId]);
    return res.rows;
  }

  /**
   * Get status history for audit timeline
   */
  async getStatusHistory(concernId) {
    const sql = `
      SELECT 
        h.id,
        h.concern_id,
        h.from_status,
        h.to_status,
        h.changed_by_user_id,
        h.comment,
        h.created_at,
        u.name as changed_by_name,
        u.email as changed_by_email,
        u.role as changed_by_role
      FROM concern_status_history h
      JOIN users u ON h.changed_by_user_id = u.id
      WHERE h.concern_id = $1
      ORDER BY h.created_at ASC;
    `;
    const res = await db.query(sql, [concernId]);
    return res.rows;
  }

  /**
   * Resolve live related record preview snapshot
   */
  async resolveRelatedRecord(entityType, entityId) {
    if (!entityType || !entityId) return null;

    try {
      if (entityType === 'ATTENDANCE') {
        const res = await db.query(`
          SELECT id, date, clock_in, clock_out, total_hours, status, notes
          FROM attendance
          WHERE id = $1;
        `, [entityId]);
        if (res.rows[0]) {
          return {
            type: 'ATTENDANCE',
            id: res.rows[0].id,
            title: `Attendance Record: ${new Date(res.rows[0].date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
            subtitle: `Status: ${res.rows[0].status} • Hours: ${parseFloat(res.rows[0].total_hours || 0).toFixed(2)} hrs`,
            details: res.rows[0],
            link: '/attendance',
          };
        }
      }

      if (entityType === 'TIME_OFF_REQUEST') {
        const res = await db.query(`
          SELECT r.id, r.start_date, r.end_date, r.total_days, r.status, r.reason, t.name as leave_type_name
          FROM time_off_requests r
          JOIN time_off_types t ON r.time_off_type_id = t.id
          WHERE r.id = $1;
        `, [entityId]);
        if (res.rows[0]) {
          return {
            type: 'TIME_OFF_REQUEST',
            id: res.rows[0].id,
            title: `Time Off Request (${res.rows[0].leave_type_name})`,
            subtitle: `${res.rows[0].start_date} to ${res.rows[0].end_date} (${parseFloat(res.rows[0].total_days).toFixed(1)} days) • ${res.rows[0].status}`,
            details: res.rows[0],
            link: '/time-off',
          };
        }
      }

      if (entityType === 'PAYSLIP') {
        const res = await db.query(`
          SELECT p.id, p.gross_amount, p.total_deductions, p.net_amount, p.status, 
                 pr.name as payrun_name, pr.pay_period_start, pr.pay_period_end
          FROM payslips p
          JOIN payruns pr ON p.payrun_id = pr.id
          WHERE p.id = $1;
        `, [entityId]);
        if (res.rows[0]) {
          return {
            type: 'PAYSLIP',
            id: res.rows[0].id,
            title: `Payslip: ${res.rows[0].payrun_name}`,
            subtitle: `Net: ₹${parseFloat(res.rows[0].net_amount).toLocaleString('en-IN')} • Period: ${res.rows[0].pay_period_start} to ${res.rows[0].pay_period_end}`,
            details: res.rows[0],
            link: '/payroll/payslips',
          };
        }
      }

      if (entityType === 'CONTRACT') {
        const res = await db.query(`
          SELECT id, contract_type, wage_rate, wage_type, start_date, end_date, status
          FROM contracts
          WHERE id = $1;
        `, [entityId]);
        if (res.rows[0]) {
          return {
            type: 'CONTRACT',
            id: res.rows[0].id,
            title: `Employment Contract (${res.rows[0].contract_type})`,
            subtitle: `Rate: ₹${parseFloat(res.rows[0].wage_rate).toLocaleString('en-IN')} / ${res.rows[0].wage_type} • Status: ${res.rows[0].status}`,
            details: res.rows[0],
            link: `/contracts/${res.rows[0].id}`,
          };
        }
      }
    } catch (err) {
      console.warn('[ConcernRepository] Error resolving related record:', err.message);
    }

    return null;
  }
}

module.exports = new ConcernRepository();
