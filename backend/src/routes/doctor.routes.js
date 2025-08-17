const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const { validateDoctorSearch, validatePagination, validateObjectId } = require('../middleware/validation');
const {
  getSpecializations,
  searchDoctors,
  getDoctorById,
  getDoctorAvailability
} = require('../controllers/doctor.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Doctors
 *   description: Doctor discovery and information
 */

// Public routes (no authentication required)
router.get('/specializations', getSpecializations);
router.get('/', validateDoctorSearch, optionalAuth, searchDoctors);
router.get('/:id', validateObjectId('id'), getDoctorById);
router.get('/:id/availability', validateObjectId('id'), getDoctorAvailability);

module.exports = router;
