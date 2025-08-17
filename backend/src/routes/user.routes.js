const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { validateDoctorProfile } = require('../middleware/validation');
const {
  getUserProfile,
  updateUserProfile,
  createOrUpdateDoctorProfile,
  getDoctorProfile
} = require('../controllers/user.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile and doctor profile management
 */

// All user routes require authentication
router.use(authenticate);

// User profile routes
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

// Doctor profile routes
router.get('/doctor-profile', authorize('doctor'), getDoctorProfile);
router.post('/doctor-profile', authorize('doctor'), validateDoctorProfile, createOrUpdateDoctorProfile);
router.put('/doctor-profile', authorize('doctor'), validateDoctorProfile, createOrUpdateDoctorProfile);

module.exports = router;
