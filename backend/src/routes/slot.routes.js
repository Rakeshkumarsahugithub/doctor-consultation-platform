const express = require('express');
const { authenticate } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const {
  lockSlot,
  verifyOTPAndBook,
  getAvailableSlots,
  cleanupExpiredLocks
} = require('../controllers/slot.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Slots
 *   description: Slot booking and management
 */

// All slot routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/slots/lock:
 *   post:
 *     summary: Lock a slot for 5 minutes
 *     tags: [Slots]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctorId
 *               - date
 *               - startTime
 *               - endTime
 *               - mode
 *             properties:
 *               doctorId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               mode:
 *                 type: string
 *                 enum: [online, in-person]
 *     responses:
 *       200:
 *         description: Slot locked successfully
 *       400:
 *         description: Slot not available
 */
router.post('/lock', lockSlot);

/**
 * @swagger
 * /api/slots/verify-and-book:
 *   post:
 *     summary: Verify OTP and confirm booking
 *     tags: [Slots]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lockId
 *               - otpCode
 *             properties:
 *               lockId:
 *                 type: string
 *               otpCode:
 *                 type: string
 *               symptoms:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment booked successfully
 *       400:
 *         description: Invalid OTP or booking failed
 */
router.post('/verify-and-book', verifyOTPAndBook);
router.post('/verify-otp', verifyOTPAndBook);

/**
 * @swagger
 * /api/slots/doctor/{doctorId}/available:
 *   get:
 *     summary: Get available slots for a doctor
 *     tags: [Slots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [online, in-person]
 *     responses:
 *       200:
 *         description: Available slots retrieved successfully
 *       404:
 *         description: Doctor not found
 */
router.get('/available', getAvailableSlots);

/**
 * @swagger
 * /api/slots/cleanup:
 *   post:
 *     summary: Cleanup expired slot locks (admin only)
 *     tags: [Slots]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expired locks cleaned up successfully
 */
router.post('/cleanup', cleanupExpiredLocks);

module.exports = router;
