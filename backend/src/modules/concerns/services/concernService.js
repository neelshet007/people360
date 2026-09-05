const concernRepository = require('../repositories/concernRepository');
const db = require('../../../database/db');
const ApiError = require('../../../utils/ApiError');
const { ROLES } = require('../../../utils/rbac');

const VALID_CATEGORIES = [
  'ATTENDANCE',
  'TIME_OFF',
  'PAYROLL',
  'CONTRACT',
  'WORKPLACE',
  'POLICY',
  'OTHER',
];

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const VALID_STATUSES = [
  'OPEN',
  'UNDER_REVIEW',
  'WAITING_FOR_EMPLOYEE',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
];

const ALLOWED_TRANSITIONS = {
  OPEN: ['UNDER_REVIEW', 'WAITING_FOR_EMPLOYEE', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  UNDER_REVIEW: ['WAITING_FOR_EMPLOYEE', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  WAITING_FOR_EMPLOYEE: ['UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  IN_PROGRESS: ['UNDER_REVIEW', 'WAITING_FOR_EMPLOYEE', 'RESOLVED', 'CLOSED'],
  RESOLVED: ['CLOSED', 'OPEN'],
  CLOSED: ['OPEN'],
};

class ConcernService {
  /**
   * List concerns with filtering and RBAC isolation
   */
  async listConcerns(user, filters = {}) {
    const isEmployee = user.role === ROLES.EMPLOYEE;

    return await concernRepository.findAll({
      isEmployee,
      userId: user.id,
      employeeId: user.employeeId,
      category: filters.category || null,
      status: filters.status || null,
      priority: filters.priority || null,
      assignedTo: filters.assignedTo || null,
      search: filters.search || null,
      limit: parseInt(filters.limit || 50, 10),
      offset: parseInt(filters.offset || 0, 10),
    });
  }

  /**
   * Get KPI summary metrics
   */
  async getMetrics(user) {
    const isEmployee = user.role === ROLES.EMPLOYEE;
    return await concernRepository.getMetrics({
      isEmployee,
      userId: user.id,
      employeeId: user.employeeId,
    });
  }

  /**
   * Get single concern detail with messages, status history, and linked record
   */
  async getConcernDetail(id, user) {
    const concern = await concernRepository.findById(id);
    if (!concern) {
      throw ApiError.notFound(`Concern with ID '${id}' does not exist.`);
    }

    const isEmployee = user.role === ROLES.EMPLOYEE;

    // Strict employee isolation check
    if (isEmployee) {
      const isOwner = concern.raised_by_user_id === user.id;
      const isSubject = concern.subject_employee_id === user.employeeId;
      if (!isOwner && !isSubject) {
        throw ApiError.forbidden('Access denied. You are not authorized to view this concern.');
      }
    }

    // Fetch conversation thread and history
    const [messages, history, relatedRecord] = await Promise.all([
      concernRepository.getMessages(id, { isEmployee }),
      concernRepository.getStatusHistory(id),
      concern.related_entity_type && concern.related_entity_id
        ? concernRepository.resolveRelatedRecord(concern.related_entity_type, concern.related_entity_id)
        : Promise.resolve(null),
    ]);

    return {
      ...concern,
      messages,
      status_history: history,
      related_record: relatedRecord,
    };
  }

  /**
   * Create a new concern
   */
  async createConcern(user, data) {
    const {
      subject,
      description,
      category,
      priority = 'MEDIUM',
      subjectEmployeeId,
      relatedEntityType = null,
      relatedEntityId = null,
      assignedToUserId = null,
    } = data;

    if (!subject || !subject.trim()) {
      throw ApiError.badRequest('Concern subject is required.');
    }

    if (!description || !description.trim()) {
      throw ApiError.badRequest('Concern description is required.');
    }

    if (!category || !VALID_CATEGORIES.includes(category.toUpperCase())) {
      throw ApiError.badRequest(`Invalid category '${category}'. Allowed: ${VALID_CATEGORIES.join(', ')}`);
    }

    const cleanCategory = category.toUpperCase();

    if (priority && !VALID_PRIORITIES.includes(priority.toUpperCase())) {
      throw ApiError.badRequest(`Invalid priority '${priority}'. Allowed: ${VALID_PRIORITIES.join(', ')}`);
    }

    const cleanPriority = priority ? priority.toUpperCase() : 'MEDIUM';

    // Target employee resolution
    let targetEmployeeId = subjectEmployeeId;
    if (user.role === ROLES.EMPLOYEE) {
      if (!user.employeeId) {
        throw ApiError.badRequest('Your user account is not linked to an employee profile.');
      }
      // Employees can only raise concerns regarding themselves
      targetEmployeeId = user.employeeId;
    } else {
      if (!targetEmployeeId) {
        throw ApiError.badRequest('Subject employee is required when creating a concern as HR/Management.');
      }
    }

    // Verify employee exists
    const empCheck = await db.query('SELECT id, first_name, last_name FROM employees WHERE id = $1', [targetEmployeeId]);
    if (empCheck.rows.length === 0) {
      throw ApiError.notFound('Target employee profile does not exist.');
    }

    // Verify related record if provided
    if (relatedEntityType && relatedEntityId) {
      const validRelated = ['ATTENDANCE', 'TIME_OFF_REQUEST', 'PAYSLIP', 'CONTRACT', 'OTHER'];
      if (!validRelated.includes(relatedEntityType.toUpperCase())) {
        throw ApiError.badRequest(`Invalid related entity type '${relatedEntityType}'.`);
      }
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const created = await concernRepository.create({
        raisedByUserId: user.id,
        subjectEmployeeId: targetEmployeeId,
        category: cleanCategory,
        subject: subject.trim(),
        description: description.trim(),
        priority: cleanPriority,
        relatedEntityType: relatedEntityType ? relatedEntityType.toUpperCase() : null,
        relatedEntityId: relatedEntityId || null,
        assignedToUserId: assignedToUserId || null,
      }, client);

      // Record initial creation in status history
      await client.query(`
        INSERT INTO concern_status_history (
          concern_id, from_status, to_status, changed_by_user_id, comment
        ) VALUES ($1, NULL, 'OPEN', $2, 'Concern created');
      `, [created.id, user.id]);

      // Add initial description as first conversation message
      await client.query(`
        INSERT INTO concern_messages (
          concern_id, sender_user_id, message, is_internal
        ) VALUES ($1, $2, $3, false);
      `, [created.id, user.id, description.trim()]);

      await client.query('COMMIT');
      return created;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Add message to conversation
   */
  async addMessage(concernId, user, { message, isInternal = false }) {
    if (!message || !message.trim()) {
      throw ApiError.badRequest('Message content cannot be empty.');
    }

    const concern = await concernRepository.findById(concernId);
    if (!concern) {
      throw ApiError.notFound(`Concern '${concernId}' not found.`);
    }

    const isEmployee = user.role === ROLES.EMPLOYEE;

    // Check participation
    if (isEmployee) {
      const isOwner = concern.raised_by_user_id === user.id;
      const isSubject = concern.subject_employee_id === user.employeeId;
      if (!isOwner && !isSubject) {
        throw ApiError.forbidden('You are not authorized to participate in this concern.');
      }
    }

    // Strict rule: Employees CANNOT post internal notes
    const flagInternal = isEmployee ? false : Boolean(isInternal);

    const savedMsg = await concernRepository.addMessage(
      concernId,
      user.id,
      message.trim(),
      flagInternal
    );

    // If waiting for employee and employee replies, transition back to UNDER_REVIEW
    if (isEmployee && concern.status === 'WAITING_FOR_EMPLOYEE') {
      await concernRepository.updateStatus(
        concernId,
        'WAITING_FOR_EMPLOYEE',
        'UNDER_REVIEW',
        user.id,
        'Employee provided response'
      );
    }

    return savedMsg;
  }

  /**
   * Transition concern status
   */
  async updateStatus(concernId, user, { status, comment = null }) {
    if (!status || !VALID_STATUSES.includes(status.toUpperCase())) {
      throw ApiError.badRequest(`Invalid status '${status}'. Allowed: ${VALID_STATUSES.join(', ')}`);
    }

    const nextStatus = status.toUpperCase();

    const concern = await concernRepository.findById(concernId);
    if (!concern) {
      throw ApiError.notFound(`Concern '${concernId}' not found.`);
    }

    const currentStatus = concern.status;

    if (currentStatus === nextStatus) {
      return concern; // No-op
    }

    // Validate state machine transitions
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw ApiError.badRequest(
        `Invalid status transition from '${currentStatus}' to '${nextStatus}'. Allowed: ${allowed.join(', ') || 'None'}`
      );
    }

    // Role permission enforcement
    if (user.role === ROLES.EMPLOYEE) {
      // Employees may only close a resolved concern or reopen a closed/resolved concern
      const employeeAllowed = (currentStatus === 'RESOLVED' && nextStatus === 'CLOSED') ||
                              (['RESOLVED', 'CLOSED'].includes(currentStatus) && nextStatus === 'OPEN');
      if (!employeeAllowed) {
        throw ApiError.forbidden(
          `Employees cannot transition status from '${currentStatus}' to '${nextStatus}'. Contact HR.`
        );
      }
    }

    return await concernRepository.updateStatus(
      concernId,
      currentStatus,
      nextStatus,
      user.id,
      comment || `Status updated from ${currentStatus} to ${nextStatus}`
    );
  }

  /**
   * Assign concern to user
   */
  async assign(concernId, user, { assignedToUserId, comment = null }) {
    if (user.role === ROLES.EMPLOYEE) {
      throw ApiError.forbidden('Employees are not authorized to assign concerns.');
    }

    if (!assignedToUserId) {
      throw ApiError.badRequest('Assigned user ID is required.');
    }

    // Verify user exists and is HR/Admin
    const userRes = await db.query('SELECT id, name, role FROM users WHERE id = $1', [assignedToUserId]);
    if (userRes.rows.length === 0) {
      throw ApiError.notFound('Target assignee user does not exist.');
    }

    const assignee = userRes.rows[0];
    if (assignee.role === ROLES.EMPLOYEE) {
      throw ApiError.badRequest('Concerns can only be assigned to HR or Management staff.');
    }

    return await concernRepository.assign(
      concernId,
      assignedToUserId,
      user.id,
      comment || `Assigned to ${assignee.name}`
    );
  }
}

module.exports = new ConcernService();
