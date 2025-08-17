const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const cron = require('node-cron');

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         patient:
 *           type: string
 *         doctor:
 *           type: string
 *         appointmentDate:
 *           type: string
 *           format: date
 *         timeSlot:
 *           type: object
 *           properties:
 *             startTime:
 *               type: string
 *             endTime:
 *               type: string
 *         consultationMode:
 *           type: string
 *           enum: [online, in-person]
 *         status:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled, rescheduled]
 *         consultationFee:
 *           type: number
 */

/**
 * @swagger
 * /api/appointments/book:
 *   post:
 *     summary: Book an appointment
 *     tags: [Appointments]
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
 *               - appointmentDate
 *               - timeSlot
 *               - consultationMode
 *             properties:
 *               doctorId:
 *                 type: string
 *               appointmentDate:
 *                 type: string
 *                 format: date
 *               timeSlot:
 *                 type: object
 *                 properties:
 *                   startTime:
 *                     type: string
 *                   endTime:
 *                     type: string
 *               consultationMode:
 *                 type: string
 *                 enum: [online, in-person]
 *               symptoms:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment booked successfully
 *       400:
 *         description: Slot not available or validation error
 *       404:
 *         description: Doctor not found
 */
const bookAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, timeSlot, consultationMode, symptoms, notes } = req.body;
    const patientId = req.user._id;

    // Verify doctor exists and is available
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found',
        message: 'The selected doctor does not exist'
      });
    }

    if (!doctor.isActive || !doctor.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Doctor not available',
        message: 'The selected doctor is not currently available'
      });
    }

    // Check if doctor supports the consultation mode
    if (!doctor.consultationModes.includes(consultationMode)) {
      return res.status(400).json({
        success: false,
        error: 'Consultation mode not supported',
        message: `Doctor does not offer ${consultationMode} consultations`
      });
    }

    // Check if appointment date is in the future
    const appointmentDateTime = new Date(appointmentDate);
    const now = new Date();
    if (appointmentDateTime <= now) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date',
        message: 'Appointment date must be in the future'
      });
    }

    // Check if slot is already booked or locked
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: {
        $gte: new Date(appointmentDate + 'T00:00:00.000Z'),
        $lt: new Date(appointmentDate + 'T23:59:59.999Z')
      },
      'slot.startTime': timeSlot.startTime,
      'slot.endTime': timeSlot.endTime,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        error: 'Slot not available',
        message: 'This time slot is already booked'
      });
    }

    // Check for active slot locks
    const lockedSlot = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: {
        $gte: new Date(appointmentDate + 'T00:00:00.000Z'),
        $lt: new Date(appointmentDate + 'T23:59:59.999Z')
      },
      'slot.startTime': timeSlot.startTime,
      'slot.endTime': timeSlot.endTime,
      'slotLock.isLocked': true,
      'slotLock.expiresAt': { $gt: new Date() },
      'slotLock.lockedBy': { $ne: patientId }
    });

    if (lockedSlot) {
      return res.status(400).json({
        success: false,
        error: 'Slot temporarily locked',
        message: 'This slot is currently being booked by another user. Please try again in a few minutes.'
      });
    }

    // Get consultation fee
    const consultationFee = consultationMode === 'online' 
      ? doctor.consultationFee.online 
      : doctor.consultationFee.inPerson;

    // Create appointment with slot lock
    const appointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      appointmentDate,
      slot: {
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        mode: consultationMode
      },
      consultationFee,
      symptoms,
      notes: {
        patient: notes
      },
      slotLock: {
        isLocked: true,
        lockedBy: patientId
      }
    });

    await appointment.save();

    // Populate appointment details for response
    await appointment.populate([
      { path: 'patient', select: 'name email phone profileImage' },
      { path: 'doctor', select: 'name user specializations rating profileImage', populate: { path: 'user', select: 'name email phone profileImage' } }
    ]);

    res.status(201).json({
      success: true,
      message: 'Appointment slot locked. Please confirm within 5 minutes.',
      data: {
        appointment,
        lockExpiresAt: appointment.slotLock.expiresAt,
        lockDurationMinutes: parseInt(process.env.SLOT_LOCK_DURATION_MINUTES) || 5
      }
    });

  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to book appointment',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/appointments/{id}/confirm:
 *   put:
 *     summary: Confirm a locked appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               otp:
 *                 type: string
 *                 description: Mock OTP for confirmation
 *     responses:
 *       200:
 *         description: Appointment confirmed successfully
 *       400:
 *         description: Invalid OTP or lock expired
 *       404:
 *         description: Appointment not found
 */
const confirmAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;
    const userId = req.user._id;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
        message: 'Appointment does not exist'
      });
    }

    // Check if user owns this appointment
    if (appointment.patient.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only confirm your own appointments'
      });
    }

    // Check if appointment is in pending status with active lock
    if (appointment.status !== 'pending' || !appointment.slotLock.isLocked) {
      return res.status(400).json({
        success: false,
        error: 'Cannot confirm appointment',
        message: 'Appointment is not in a confirmable state'
      });
    }

    // Check if lock has expired
    if (appointment.slotLock.expiresAt < new Date()) {
      // Release the expired lock
      await appointment.releaseLock();
      return res.status(400).json({
        success: false,
        error: 'Lock expired',
        message: 'The slot lock has expired. Please book again.'
      });
    }

    // Mock OTP validation (in real implementation, validate against sent OTP)
    if (otp !== '123456') {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP',
        message: 'The OTP provided is incorrect'
      });
    }

    // Confirm the appointment
    await appointment.confirm();

    // Populate appointment details
    await appointment.populate([
      { path: 'patient', select: 'name email phone profileImage' },
      { path: 'doctor', select: 'name user specializations rating profileImage', populate: { path: 'user', select: 'name email phone profileImage' } }
    ]);

    res.json({
      success: true,
      message: 'Appointment confirmed successfully',
      data: appointment
    });

  } catch (error) {
    console.error('Confirm appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm appointment',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/appointments/user:
 *   get:
 *     summary: Get user's appointments
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled, rescheduled]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: User appointments retrieved successfully
 */
const getUserAppointments = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
    const userId = req.user._id;
    const userRole = req.user.role || 'patient';
    
    console.log('getUserAppointments - userId:', userId, 'userRole:', userRole, 'status filter:', status);
    console.log('Query params:', req.query);

    // Build filter query
    const filter = {};
    
    if (userRole === 'patient') {
      filter.patient = userId;
    } else if (userRole === 'doctor') {
      // Find doctor profile for this user
      try {
        const doctorProfile = await Doctor.findOne({ user: userId });
        if (!doctorProfile) {
          return res.status(404).json({
            success: false,
            error: 'Doctor profile not found',
            message: 'No doctor profile found for this user'
          });
        }
        filter.doctor = doctorProfile._id;
      } catch (docError) {
        console.error('Error finding doctor profile:', docError);
        filter.patient = userId; // Fallback to patient filter
      }
    }

    // Map frontend status to backend status
    if (status) {
      if (status === 'booked') {
        filter.status = { $in: ['pending', 'confirmed'] };
      } else {
        filter.status = status;
      }
    }

    if (startDate || endDate) {
      filter.appointmentDate = {};
      if (startDate) {
        filter.appointmentDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.appointmentDate.$lte = new Date(endDate);
      }
    }

    console.log('Filter query:', JSON.stringify(filter, null, 2));

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let appointments = [];
    let total = 0;

    try {
      // Get appointments with virtuals for canCancel and canReschedule
      appointments = await Appointment.find(filter)
        .populate('patient', 'name email phone profileImage')
        .populate({
          path: 'doctor',
          select: 'name user specializations rating consultationFee profileImage',
          populate: { path: 'user', select: 'name email phone profileImage' }
        })
        .sort({ appointmentDate: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Convert to JSON to include virtuals
      appointments = appointments.map(apt => {
        const aptObj = apt.toJSON();
        return aptObj;
      });

      console.log('Found appointments:', appointments.length);

      // Get total count
      total = await Appointment.countDocuments(filter);
    } catch (dbError) {
      console.error('Database query error:', dbError);
      // Return empty results if database query fails
      appointments = [];
      total = 0;
    }

    // Categorize appointments
    const now = new Date();
    const categorized = {
      upcoming: [],
      past: [],
      cancelled: []
    };

    appointments.forEach(appointment => {
      try {
        const appointmentDateTime = new Date(appointment.appointmentDate);
        if (appointment.slot && appointment.slot.startTime) {
          const [hours, minutes] = appointment.slot.startTime.split(':');
          appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }

        if (appointment.status === 'cancelled') {
          categorized.cancelled.push(appointment);
        } else if (appointmentDateTime > now) {
          categorized.upcoming.push(appointment);
        } else {
          categorized.past.push(appointment);
        }
      } catch (error) {
        console.error('Error processing appointment:', appointment._id, error);
        categorized.past.push(appointment);
      }
    });

    // Map canRescheduleVirtual to canReschedule for frontend compatibility
    const appointmentsWithFlags = appointments.map(app => ({
      ...app,
      canReschedule: app.canRescheduleVirtual,
      canCancel: app.canCancel
    }));

    res.json({
      success: true,
      message: 'Appointments retrieved successfully',
      data: {
        appointments: appointmentsWithFlags,
        categorized,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        },
        filters: {
          status,
          startDate,
          endDate
        }
      }
    });

  } catch (error) {
    console.error('Error in getUserAppointments:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/appointments/{id}/cancel:
 *   put:
 *     summary: Cancel an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully
 *       400:
 *         description: Cannot cancel appointment (within 24 hours)
 *       404:
 *         description: Appointment not found
 */
const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
        message: 'Appointment with this ID does not exist'
      });
    }

    // Check if appointment is already cancelled
    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Appointment already cancelled',
        message: 'This appointment has already been cancelled'
      });
    }

    // Check if user can cancel this appointment
    let canCancel = false;
    if (userRole === 'patient' && appointment.patient.toString() === userId.toString()) {
      canCancel = true;
    } else if (userRole === 'doctor' && appointment.doctor.toString() === userId.toString()) {
      canCancel = true;
    } else if (userRole === 'admin') {
      canCancel = true;
    }

    if (!canCancel) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You cannot cancel this appointment'
      });
    }

    // Check if appointment can be cancelled (24-hour rule)
    if (!appointment.canCancel) {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel appointment',
        message: 'Appointments can only be cancelled more than 24 hours before the appointment time'
      });
    }

    // Cancel the appointment
    await appointment.cancel(userRole, reason);

    // Populate appointment details
    await appointment.populate([
      { path: 'patient', select: 'name email phone' },
      { path: 'doctor', select: 'name user specializations rating', populate: { path: 'user', select: 'name email phone' } }
    ]);

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: appointment
    });

  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel appointment',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/appointments/{id}/reschedule:
 *   put:
 *     summary: Reschedule an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newDate
 *               - newTimeSlot
 *             properties:
 *               newDate:
 *                 type: string
 *                 format: date
 *               newTimeSlot:
 *                 type: object
 *                 properties:
 *                   startTime:
 *                     type: string
 *                   endTime:
 *                     type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment rescheduled successfully
 *       400:
 *         description: Cannot reschedule or new slot not available
 */
const rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDate, newTimeSlot, reason } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
        message: 'Appointment does not exist'
      });
    }

    // Check if user can reschedule this appointment
    let canReschedule = false;
    if (userRole === 'patient' && appointment.patient.toString() === userId.toString()) {
      canReschedule = true;
    } else if (userRole === 'doctor') {
      const doctorProfile = await Doctor.findOne({ user: userId });
      if (doctorProfile && appointment.doctor.toString() === doctorProfile._id.toString()) {
        canReschedule = true;
      }
    } else if (userRole === 'admin') {
      canReschedule = true;
    }

    if (!canReschedule) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You cannot reschedule this appointment'
      });
    }

    // Check if appointment can be rescheduled (same rules as cancellation)
    if (!appointment.canReschedule) {
      return res.status(400).json({
        success: false,
        error: 'Cannot reschedule appointment',
        message: 'Appointments can only be rescheduled more than 24 hours before the scheduled time'
      });
    }

    // Check if new slot is available
    const conflictingAppointment = await Appointment.findOne({
      doctor: appointment.doctor,
      appointmentDate: {
        $gte: new Date(newDate + 'T00:00:00.000Z'),
        $lt: new Date(newDate + 'T23:59:59.999Z')
      },
      'slot.startTime': newTimeSlot.startTime,
      'slot.endTime': newTimeSlot.endTime,
      status: { $in: ['pending', 'confirmed'] },
      _id: { $ne: id }
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        error: 'New slot not available',
        message: 'The requested new time slot is already booked'
      });
    }

    // Store original appointment details
    const originalDate = appointment.appointmentDate;
    const originalTimeSlot = { ...appointment.slot };

    // Update appointment
    appointment.rescheduling = {
      originalDate,
      originalTimeSlot,
      rescheduledBy: userRole,
      rescheduledAt: new Date(),
      reason
    };

    appointment.appointmentDate = new Date(newDate);
    appointment.slot = {
      startTime: newTimeSlot.startTime,
      endTime: newTimeSlot.endTime,
      mode: appointment.slot.mode
    };
    appointment.status = 'rescheduled';

    await appointment.save();

    // Populate appointment details
    await appointment.populate([
      { path: 'patient', select: 'name email phone' },
      { path: 'doctor', select: 'name user specializations rating', populate: { path: 'user', select: 'name email phone' } }
    ]);

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: appointment
    });

  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reschedule appointment',
      message: error.message
    });
  }
};

// Cron job to release expired slot locks
cron.schedule('*/1 * * * *', async () => {
  try {
    const result = await Appointment.releaseExpiredLocks();
    if (result.modifiedCount > 0) {
      console.log(`Released ${result.modifiedCount} expired slot locks`);
    }
  } catch (error) {
    console.error('Error releasing expired locks:', error);
  }
});

module.exports = {
  bookAppointment,
  confirmAppointment,
  getUserAppointments,
  cancelAppointment,
  rescheduleAppointment
};
