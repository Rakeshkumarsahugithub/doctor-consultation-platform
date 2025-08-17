const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getDoctorDashboard,
  getDoctorCalendar,
  updateDoctorAvailability
} = require('../controllers/doctor-dashboard.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Doctor Dashboard
 *   description: Doctor dashboard and calendar management
 */

// All doctor dashboard routes require authentication and doctor role
router.use(authenticate);
router.use(authorize('doctor'));

// Dashboard overview
router.get('/dashboard', getDoctorDashboard);

// Calendar view
router.get('/calendar', getDoctorCalendar);

// Update availability
router.put('/availability', updateDoctorAvailability);

module.exports = router;
