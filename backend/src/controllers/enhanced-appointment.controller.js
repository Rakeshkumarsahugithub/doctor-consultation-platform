const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const SlotLock = require('../models/SlotLock');

/**
 * Get user appointments with filtering and categorization
 */
const getUserAppointments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter = { patient: userId };

    if (status && status !== 'all') {
      if (status === 'upcoming') {
        filter.appointmentDate = { $gte: new Date() };
        filter.status = { $in: ['confirmed', 'pending'] };
      } else if (status === 'past') {
        filter.appointmentDate = { $lt: new Date() };
        filter.status = { $in: ['completed'] };
      } else {
        filter.status = status;
      }
    }

    if (startDate || endDate) {
      filter.appointmentDate = {};
      if (startDate) filter.appointmentDate.$gte = new Date(startDate);
      if (endDate) filter.appointmentDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name email phone profileImage')
      .populate({
        path: 'doctor',
        select: 'name user specializations rating consultationFee profileImage',
        populate: { path: 'user', select: 'name email phone profileImage' }
      })
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(filter);

    // Categorize appointments
    const now = new Date();
    const categorized = {
      upcoming: [],
      past: [],
      cancelled: []
    };

    appointments.forEach(appointment => {
      if (appointment.status === 'cancelled') {
        categorized.cancelled.push(appointment);
      } else if (appointment.appointmentDate > now) {
        categorized.upcoming.push(appointment);
      } else {
        categorized.past.push(appointment);
      }
    });

    res.json({
      success: true,
      message: 'Appointments retrieved successfully',
      data: {
        appointments,
        categorized,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get user appointments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve appointments',
      message: error.message
    });
  }
};

/**
 * Reschedule appointment with 24-hour restriction
 */
const rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { newAppointmentDate, newTimeSlot } = req.body;
    const userId = req.user._id;

    const appointment = await Appointment.findById(id)
      .populate('doctor')
      .populate('patient');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
        message: 'Appointment not found'
      });
    }

    // Check authorization
    if (appointment.patient._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'You can only reschedule your own appointments'
      });
    }

    // Check if appointment can be rescheduled
    if (!appointment.canReschedule) {
      return res.status(400).json({
        success: false,
        error: 'Reschedule not allowed',
        message: 'This appointment cannot be rescheduled. It may be in the past or not eligible for rescheduling.'
      });
    }

    // Check if appointment can be rescheduled
    if (!['confirmed', 'pending'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot reschedule',
        message: `Cannot reschedule ${appointment.status} appointment`
      });
    }

    // Check if new slot is available
    const isAvailable = await SlotLock.isSlotAvailable(
      appointment.doctor._id,
      newAppointmentDate,
      newTimeSlot.startTime,
      newTimeSlot.endTime,
      newTimeSlot.mode
    );

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        error: 'Slot not available',
        message: 'The selected slot is not available'
      });
    }

    // Update appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      {
        appointmentDate: new Date(newAppointmentDate),
        slot: newTimeSlot,
        status: 'confirmed',
        bookingType: 'rescheduled',
        originalAppointment: appointment.originalAppointment || appointment._id
      },
      { new: true }
    ).populate('doctor').populate('patient');

    // Mark original appointment as rescheduled
    if (!appointment.originalAppointment) {
      await Appointment.findByIdAndUpdate(id, { status: 'rescheduled' });
    }

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: updatedAppointment
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

/**
 * Cancel appointment
 */
const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
        message: 'Appointment not found'
      });
    }

    // Check authorization
    if (appointment.patient.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'You can only cancel your own appointments'
      });
    }

    // Update appointment status
    appointment.status = 'cancelled';
    appointment.cancellationReason = reason;
    appointment.cancelledAt = new Date();
    await appointment.save();

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

module.exports = {
  getUserAppointments,
  rescheduleAppointment,
  cancelAppointment
};
