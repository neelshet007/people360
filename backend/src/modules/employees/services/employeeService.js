const employeeRepository = require('../repositories/employeeRepository');
const { validateEmployeeInput } = require('../validators/employeeValidator');

/**
 * Employee Service Layer
 * Owner: P1 (Core HR)
 * Implements business rules and domain validations
 */
const employeeService = {
  getEmployees: async ({ page = 1, limit = 10, search = '', department = '', status = '', sortBy = 'created_at', sortOrder = 'DESC' }) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      employeeRepository.findAll({
        search: search.trim(),
        department: department.trim(),
        status: status.trim(),
        sortBy,
        sortOrder,
        limit: limitNum,
        offset,
      }),
      employeeRepository.count({
        search: search.trim(),
        department: department.trim(),
        status: status.trim(),
      }),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      employees: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    };
  },

  getEmployeeById: async (id) => {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      const error = new Error(`Employee with ID '${id}' was not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }
    return employee;
  },

  createEmployee: async (data) => {
    // 1. Validate fields
    const validation = validateEmployeeInput(data, false);
    if (!validation.isValid) {
      const error = new Error('Validation failed on employee data');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      error.details = validation.errors;
      throw error;
    }

    // 2. Check duplicate email
    const existingEmail = await employeeRepository.findByEmail(data.email.trim());
    if (existingEmail) {
      const error = new Error(`An employee with email '${data.email}' already exists`);
      error.statusCode = 409;
      error.code = 'DUPLICATE_ENTITY';
      error.details = ['email already in use'];
      throw error;
    }

    // 3. Check duplicate code
    const existingCode = await employeeRepository.findByCode(data.employee_code.trim());
    if (existingCode) {
      const error = new Error(`An employee with code '${data.employee_code}' already exists`);
      error.statusCode = 409;
      error.code = 'DUPLICATE_ENTITY';
      error.details = ['employee_code already in use'];
      throw error;
    }

    // 4. Clean data & create
    const cleanData = {
      ...data,
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      email: data.email.trim().toLowerCase(),
      employee_code: data.employee_code.trim(),
      department: data.department.trim(),
      designation: data.designation.trim(),
      status: (data.status || 'ACTIVE').toUpperCase(),
    };

    return employeeRepository.create(cleanData);
  },

  updateEmployee: async (id, data) => {
    // 1. Verify existence
    const existing = await employeeRepository.findById(id);
    if (!existing) {
      const error = new Error(`Employee with ID '${id}' was not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // 2. Validate fields
    const validation = validateEmployeeInput(data, true);
    if (!validation.isValid) {
      const error = new Error('Validation failed on employee update data');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      error.details = validation.errors;
      throw error;
    }

    // 3. Check duplicate email if changing
    if (data.email && data.email.toLowerCase() !== existing.email.toLowerCase()) {
      const duplicateEmail = await employeeRepository.findByEmail(data.email.trim(), id);
      if (duplicateEmail) {
        const error = new Error(`An employee with email '${data.email}' already exists`);
        error.statusCode = 409;
        error.code = 'DUPLICATE_ENTITY';
        error.details = ['email already in use'];
        throw error;
      }
    }

    // 4. Check duplicate code if changing
    if (data.employee_code && data.employee_code.toLowerCase() !== existing.employee_code.toLowerCase()) {
      const duplicateCode = await employeeRepository.findByCode(data.employee_code.trim(), id);
      if (duplicateCode) {
        const error = new Error(`An employee with code '${data.employee_code}' already exists`);
        error.statusCode = 409;
        error.code = 'DUPLICATE_ENTITY';
        error.details = ['employee_code already in use'];
        throw error;
      }
    }

    const cleanData = { ...data };
    if (cleanData.first_name) cleanData.first_name = cleanData.first_name.trim();
    if (cleanData.last_name) cleanData.last_name = cleanData.last_name.trim();
    if (cleanData.email) cleanData.email = cleanData.email.trim().toLowerCase();
    if (cleanData.employee_code) cleanData.employee_code = cleanData.employee_code.trim();
    if (cleanData.department) cleanData.department = cleanData.department.trim();
    if (cleanData.designation) cleanData.designation = cleanData.designation.trim();
    if (cleanData.status) cleanData.status = cleanData.status.toUpperCase();

    return employeeRepository.update(id, cleanData);
  },

  deleteEmployee: async (id) => {
    const existing = await employeeRepository.findById(id);
    if (!existing) {
      const error = new Error(`Employee with ID '${id}' was not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return employeeRepository.delete(id);
  },
};

module.exports = employeeService;
