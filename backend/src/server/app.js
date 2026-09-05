const express = require('express');
const cors = require('cors');
const config = require('../config');
const errorHandler = require('../middleware/errorHandler');

// Import module routers
const authRoutes = require('../modules/auth/routes');
const employeesModule = require('../modules/employees');
const contractsModule = require('../modules/contracts');
const schedulesModule = require('../modules/schedules');
const attendanceModule = require('../modules/attendance');
const timeoffModule = require('../modules/timeoff');
const payrollModule = require('../modules/payroll');

const app = express();

// Standard Middlewares
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (config.env === 'development') return callback(null, true);
    if (origin === config.corsOrigin) return callback(null, true);
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PeoplePay360 Backend API is active',
    timestamp: new Date().toISOString(),
  });
});

// Module API Routing Mounts
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeesModule.routes);
app.use('/api/contracts', contractsModule.routes);
app.use('/api/schedules', schedulesModule.routes);
app.use('/api/attendance', attendanceModule.routes);
app.use('/api/timeoff', timeoffModule.routes);
app.use('/api/payroll', payrollModule.routes);

// Central Error Handling
app.use(errorHandler);

module.exports = app;
