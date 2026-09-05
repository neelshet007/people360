const dashboardService = require('../services/dashboardService');

/**
 * Dashboard Controller
 * Dispatches real-time aggregated metrics to front-end dashboard
 */
const getStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
};
