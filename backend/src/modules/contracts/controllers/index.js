const contractService = require('../services');

/**
 * Contracts Controller
 * Owner: P1 (Core HR)
 */

const getContracts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      employee_id,
      status,
      contract_type,
      date,
      period_start,
      period_end,
      search,
    } = req.query;

    const result = await contractService.getContracts({
      page,
      limit,
      employee_id,
      status,
      contract_type,
      date,
      period_start,
      period_end,
      search,
    });

    return res.status(200).json({
      success: true,
      data: result.contracts,
      pagination: result.pagination,
      meta: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getContractById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contract = await contractService.getContractById(id);

    return res.status(200).json({
      success: true,
      data: contract,
    });
  } catch (error) {
    next(error);
  }
};

const getActiveContract = async (req, res, next) => {
  try {
    const { employee_id, employeeId, date, period_start, period_end } = { ...req.query, ...req.params };
    const empId = employee_id || employeeId;

    if (!empId) {
      return res.status(400).json({
        success: false,
        message: 'employee_id is required',
      });
    }

    let contract;
    if (period_start && period_end) {
      contract = await contractService.getActiveContractForPeriod(empId, period_start, period_end);
    } else {
      contract = await contractService.getActiveContractForDate(empId, date);
    }

    return res.status(200).json({
      success: true,
      data: contract,
      message: 'Active contract retrieved for specified period/date',
    });
  } catch (error) {
    next(error);
  }
};

const createContract = async (req, res, next) => {
  try {
    const newContract = await contractService.createContract(req.body);

    return res.status(201).json({
      success: true,
      data: newContract,
      message: 'Contract created successfully',
    });
  } catch (error) {
    next(error);
  }
};

const updateContract = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedContract = await contractService.updateContract(id, req.body);

    return res.status(200).json({
      success: true,
      data: updatedContract,
      message: 'Contract updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const deleteContract = async (req, res, next) => {
  try {
    const { id } = req.params;
    await contractService.deleteContract(id);

    return res.status(200).json({
      success: true,
      message: 'Contract deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContracts,
  getContractById,
  getActiveContract,
  createContract,
  updateContract,
  deleteContract,
};
