const SlotLock = require('../models/SlotLock');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

/**
 * Lock a slot for 5 minutes with OTP verification
 */
const lockSlot = async (req, res) => {
  try {
    const { doctorId, date, startTime, endTime, mode } = req.body;
    const userId = req.user._id;

    // Check if slot is available
    const isAvailable = await SlotLock.isSlotAvailable(doctorId, date, startTime, endTime, mode);
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        error: 'Slot not available',
        message: 'This slot is already booked or locked by another user'
      });
    }

    // Check if doctor exists and is active
    const doctor = await Doctor.findById(doctorId).populate('user');
    if (!doctor || !doctor.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found',
        message: 'Doctor not found or inactive'
      });
    }

    // Create slot lock
    const slotLock = await SlotLock.createLock({
      doctor: doctorId,
      user: userId,
      date: new Date(date),
      startTime,
      endTime,
      mode
    });

    res.json({
      success: true,
      message: 'Slot locked successfully. Please verify OTP to confirm booking.',
      data: {
        lockId: slotLock._id,
        otpCode: slotLock.otpCode, // In production, send via SMS/email
        expiresAt: slotLock.lockExpiry,
        doctor: {
          name: doctor.name || (doctor.user && doctor.user.name ? doctor.user.name : 'Doctor'),
          specializations: doctor.specializations
        }
      }
    });

  } catch (error) {
    console.error('Lock slot error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to lock slot',
      message: error.message
    });
  }
};

/**
 * Verify OTP and confirm booking
 */
const verifyOTPAndBook = async (req, res) => {
  try {
    const { lockId, otpCode, otp, symptoms, notes } = req.body;
    const finalOtp = otpCode || otp;
    const userId = req.user._id;

    // Find the slot lock
    const slotLock = await SlotLock.findById(lockId)
      .populate('doctor')
      .populate('user');

    if (!slotLock) {
      return res.status(404).json({
        success: false,
        error: 'Lock not found',
        message: 'Slot lock not found'
      });
    }

    // Verify user owns this lock
    if (slotLock.user._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'You are not authorized to confirm this booking'
      });
    }

    // Verify OTP and confirm
    try {
      await slotLock.verifyOTP(finalOtp);
    } catch (error) {
      console.log('OTP Verification Error:', error.message, 'Provided OTP:', finalOtp, 'Stored OTP:', slotLock.otpCode);
      return res.status(400).json({
        success: false,
        error: 'OTP verification failed',
        message: error.message
      });
    }

    // Get consultation fee
    const doctor = await Doctor.findById(slotLock.doctor._id);
    const consultationFee = slotLock.mode === 'online' 
      ? doctor.consultationFee.online 
      : doctor.consultationFee.inPerson;

    // Create appointment
    const appointment = new Appointment({
      patient: userId,
      doctor: slotLock.doctor._id,
      appointmentDate: slotLock.date,
      slot: {
        startTime: slotLock.startTime,
        endTime: slotLock.endTime,
        mode: slotLock.mode
      },
      consultationFee,
      symptoms,
      notes: { patient: notes }
    });

    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        appointmentId: appointment._id,
        appointmentDate: appointment.appointmentDate,
        slot: appointment.slot,
        consultationFee: appointment.consultationFee,
        status: appointment.status
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(400).json({
      success: false,
      error: 'Booking failed',
      message: error.message
    });
  }
};

/**
 * Get available slots for a doctor on a specific date
 */
const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date, mode } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Doctor ID and date are required'
      });
    }

    // Get doctor's availability for the day
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found',
        message: 'Doctor not found'
      });
    }

    // Generate time slots based on doctor's availability
    const requestDate = new Date(date);
    const dayName = requestDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    console.log('Debug - Date:', date, 'Day:', dayName, 'Doctor availability:', doctor.availability);
    
    // Find doctor's availability for this day
    const dayAvailability = doctor.availability?.schedule?.find(avail => 
      avail.day.toLowerCase() === dayName.toLowerCase()
    );

    if (!dayAvailability || !dayAvailability.slots || dayAvailability.slots.length === 0) {
      // If no availability found, create some default slots for testing
      const defaultSlots = [
        { startTime: '09:00', endTime: '09:30', mode: 'online' },
        { startTime: '09:30', endTime: '10:00', mode: 'online' },
        { startTime: '10:00', endTime: '10:30', mode: 'online' },
        { startTime: '10:30', endTime: '11:00', mode: 'online' },
        { startTime: '11:00', endTime: '11:30', mode: 'online' },
        { startTime: '14:00', endTime: '14:30', mode: 'in-person' },
        { startTime: '14:30', endTime: '15:00', mode: 'in-person' },
        { startTime: '15:00', endTime: '15:30', mode: 'in-person' },
        { startTime: '15:30', endTime: '16:00', mode: 'in-person' },
        { startTime: '16:00', endTime: '16:30', mode: 'in-person' }
      ];

      const availableSlots = [];
      for (const slot of defaultSlots) {
        // Filter by mode if specified
        if (mode && slot.mode !== mode) {
          continue;
        }

        // Check if slot is not booked or locked
        const isAvailable = await SlotLock.isSlotAvailable(
          doctorId, 
          new Date(date), 
          slot.startTime, 
          slot.endTime, 
          slot.mode
        );

        availableSlots.push({
          startTime: slot.startTime,
          endTime: slot.endTime,
          mode: slot.mode,
          isAvailable
        });
      }

      return res.json({
        success: true,
        message: 'Available slots retrieved successfully (using default schedule)',
        data: {
          slots: availableSlots,
          date,
          doctorId,
          mode
        }
      });
    }

    // Generate available slots
    const availableSlots = [];
    
    for (const slot of dayAvailability.slots) {
      // Filter by mode if specified
      if (mode && slot.mode !== mode) {
        continue;
      }

      // Check if slot is not booked or locked
      const isAvailable = await SlotLock.isSlotAvailable(
        doctorId, 
        new Date(date), 
        slot.startTime, 
        slot.endTime, 
        slot.mode
      );

      availableSlots.push({
        startTime: slot.startTime,
        endTime: slot.endTime,
        mode: slot.mode,
        isAvailable
      });
    }

    res.json({
      success: true,
      message: 'Available slots retrieved successfully',
      data: {
        slots: availableSlots,
        date,
        doctorId,
        mode
      }
    });

  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available slots',
      message: error.message
    });
  }
};

/**
 * Release expired slot locks (cleanup job)
 */
const cleanupExpiredLocks = async (req, res) => {
  try {
    const result = await SlotLock.cleanupExpiredLocks();
    
    res.json({
      success: true,
      message: 'Expired locks cleaned up successfully',
      data: {
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Cleanup expired locks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup expired locks',
      message: error.message
    });
  }
};

module.exports = {
  lockSlot,
  verifyOTPAndBook,
  getAvailableSlots,
  cleanupExpiredLocks
};
