const employeeService = require('../services');

/**
 * Employees Controller
 * Owner: P1 (Core HR)
 * HTTP parameter mapping and standard API response envelope dispatch
 */

const getEmployees = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', department = '', status = '', sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

    const result = await employeeService.getEmployees({
      page,
      limit,
      search,
      department,
      status,
      sortBy,
      sortOrder,
    });

    return res.status(200).json({
      success: true,
      data: result.employees,
      pagination: result.pagination,
      meta: result.pagination, // For dual compatibility with apiClient standard
    });
  } catch (error) {
    next(error);
  }
};

const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await employeeService.getEmployeeById(id);

    return res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

const createEmployee = async (req, res, next) => {
  try {
    const newEmployee = await employeeService.createEmployee(req.body);

    return res.status(201).json({
      success: true,
      data: newEmployee,
      message: 'Employee created successfully',
    });
  } catch (error) {
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedEmployee = await employeeService.updateEmployee(id, req.body);

    return res.status(200).json({
      success: true,
      data: updatedEmployee,
      message: 'Employee updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedEmployee = await employeeService.deleteEmployee(id);

    return res.status(200).json({
      success: true,
      data: deletedEmployee,
      message: 'Employee deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
