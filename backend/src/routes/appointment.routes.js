const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  validateBookAppointment,
  validateUpdateAppointment,
  validateAppointmentFilter,
  validatePagination,
  validateObjectId,
  validateTimeSlot
} = require('../middleware/validation');
const {
  bookAppointment,
  confirmAppointment,
  getUserAppointments,
  cancelAppointment,
  rescheduleAppointment
} = require('../controllers/appointment.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Appointment booking and management
 */

// All appointment routes require authentication
router.use(authenticate);

// Book appointment
router.post('/book', validateBookAppointment, validateTimeSlot, bookAppointment);

// Confirm appointment
router.put('/:id/confirm', validateObjectId('id'), confirmAppointment);

// Get user appointments
router.get('/user', validateAppointmentFilter, getUserAppointments);

// Cancel appointment
router.put('/:id/cancel', validateObjectId('id'), cancelAppointment);

// Reschedule appointment
router.put('/:id/reschedule', validateObjectId('id'), validateTimeSlot, rescheduleAppointment);

module.exports = router;
