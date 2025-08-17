const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

/**
 * @swagger
 * components:
 *   schemas:
 *     DoctorDashboard:
 *       type: object
 *       properties:
 *         stats:
 *           type: object
 *           properties:
 *             totalAppointments:
 *               type: number
 *             todayAppointments:
 *               type: number
 *             upcomingAppointments:
 *               type: number
 *             completedAppointments:
 *               type: number
 *         calendar:
 *           type: array
 *           items:
 *             type: object
 */

/**
 * @swagger
 * /api/doctor/dashboard:
 *   get:
 *     summary: Get doctor dashboard overview
 *     tags: [Doctor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DoctorDashboard'
 *       403:
 *         description: Access denied - not a doctor
 */
const getDoctorDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find doctor profile
    const doctorProfile = await Doctor.findOne({ user: userId })
      .populate('user', 'name email phone');

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        error: 'Doctor profile not found',
        message: 'No doctor profile found for this user'
      });
    }

    // Get appointment statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalAppointments,
      todayAppointments,
      upcomingAppointments,
      completedAppointments,
      cancelledAppointments
    ] = await Promise.all([
      Appointment.countDocuments({ doctor: doctorProfile._id }),
      Appointment.countDocuments({
        doctor: doctorProfile._id,
        appointmentDate: { $gte: today, $lt: tomorrow },
        status: { $in: ['confirmed', 'pending'] }
      }),
      Appointment.countDocuments({
        doctor: doctorProfile._id,
        appointmentDate: { $gte: today },
        status: { $in: ['confirmed', 'pending'] }
      }),
      Appointment.countDocuments({
        doctor: doctorProfile._id,
        status: 'completed'
      }),
      Appointment.countDocuments({
        doctor: doctorProfile._id,
        status: 'cancelled'
      })
    ]);

    // Get recent appointments
    const recentAppointments = await Appointment.find({
      doctor: doctorProfile._id
    })
    .populate('patient', 'name email phone')
    .sort({ appointmentDate: -1, 'timeSlot.startTime': -1 })
    .limit(5);

    // Calculate earnings (mock calculation)
    const monthlyEarnings = await Appointment.aggregate([
      {
        $match: {
          doctor: doctorProfile._id,
          status: 'completed',
          appointmentDate: {
            $gte: new Date(today.getFullYear(), today.getMonth(), 1)
          }
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$consultationFee' }
        }
      }
    ]);

    const stats = {
      totalAppointments,
      todayAppointments,
      upcomingAppointments,
      completedAppointments,
      cancelledAppointments,
      monthlyEarnings: monthlyEarnings[0]?.totalEarnings || 0,
      rating: doctorProfile.rating.average,
      totalConsultations: doctorProfile.totalConsultations
    };

    res.json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        doctor: doctorProfile,
        stats,
        recentAppointments
      }
    });

  } catch (error) {
    console.error('Get doctor dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard data',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/doctor/calendar:
 *   get:
 *     summary: Get doctor's calendar view
 *     tags: [Doctor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: number
 *         description: Month (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: Year
 *       - in: query
 *         name: view
 *         schema:
 *           type: string
 *           enum: [month, week, day]
 *         description: Calendar view type
 *     responses:
 *       200:
 *         description: Calendar data retrieved successfully
 */
const getDoctorCalendar = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year, view = 'month' } = req.query;

    // Find doctor profile
    const doctorProfile = await Doctor.findOne({ user: userId });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        error: 'Doctor profile not found',
        message: 'No doctor profile found for this user'
      });
    }

    // Set date range based on view
    let startDate, endDate;
    const now = new Date();
    const currentYear = year ? parseInt(year) : now.getFullYear();
    const currentMonth = month ? parseInt(month) - 1 : now.getMonth();

    switch (view) {
      case 'month':
        startDate = new Date(currentYear, currentMonth, 1);
        endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
        break;
      case 'week':
        const today = new Date(currentYear, currentMonth, now.getDate());
        const dayOfWeek = today.getDay();
        startDate = new Date(today);
        startDate.setDate(today.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'day':
        startDate = new Date(currentYear, currentMonth, now.getDate());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date(currentYear, currentMonth, 1);
        endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
    }

    // Get appointments for the date range
    const appointments = await Appointment.find({
      doctor: doctorProfile._id,
      appointmentDate: {
        $gte: startDate,
        $lte: endDate
      }
    })
    .populate('patient', 'name email phone')
    .sort({ appointmentDate: 1, 'timeSlot.startTime': 1 });

    // Get doctor's availability schedule
    const availability = doctorProfile.availability.schedule;

    // Generate calendar data
    const calendarData = generateCalendarData(startDate, endDate, appointments, availability, view);

    res.json({
      success: true,
      message: 'Calendar data retrieved successfully',
      data: {
        view,
        startDate,
        endDate,
        calendar: calendarData,
        appointments,
        availability
      }
    });

  } catch (error) {
    console.error('Get doctor calendar error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve calendar data',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/doctor/availability:
 *   put:
 *     summary: Update doctor availability schedule
 *     tags: [Doctor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               schedule:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day:
 *                       type: string
 *                       enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *                     slots:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           startTime:
 *                             type: string
 *                           endTime:
 *                             type: string
 *                           mode:
 *                             type: string
 *                             enum: [online, in-person]
 *     responses:
 *       200:
 *         description: Availability updated successfully
 */
const updateDoctorAvailability = async (req, res) => {
  try {
    const userId = req.user._id;
    const { schedule } = req.body;

    // Find doctor profile
    const doctorProfile = await Doctor.findOne({ user: userId });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        error: 'Doctor profile not found',
        message: 'No doctor profile found for this user'
      });
    }

    // Validate schedule format
    if (!Array.isArray(schedule)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid schedule format',
        message: 'Schedule must be an array'
      });
    }

    // Update availability
    doctorProfile.availability.schedule = schedule;
    await doctorProfile.save();

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: doctorProfile.availability
    });

  } catch (error) {
    console.error('Update doctor availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update availability',
      message: error.message
    });
  }
};

// Helper function to generate calendar data
const generateCalendarData = (startDate, endDate, appointments, availability, view) => {
  const calendarData = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dateStr = current.toISOString().split('T')[0];

    // Get appointments for this day
    const dayAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate).toISOString().split('T')[0];
      return aptDate === dateStr;
    });

    // Get availability for this day
    const dayAvailability = availability.find(avail => avail.day === dayOfWeek);

    // Calculate available slots
    const availableSlots = dayAvailability ? dayAvailability.slots.filter(slot => {
      return !dayAppointments.some(apt => 
        apt.timeSlot.startTime === slot.startTime && 
        apt.timeSlot.endTime === slot.endTime
      );
    }) : [];

    calendarData.push({
      date: dateStr,
      dayOfWeek,
      appointments: dayAppointments,
      availableSlots,
      totalSlots: dayAvailability ? dayAvailability.slots.length : 0,
      bookedSlots: dayAppointments.length,
      isAvailable: dayAvailability ? dayAvailability.slots.length > 0 : false
    });

    current.setDate(current.getDate() + 1);
  }

  return calendarData;
};

module.exports = {
  getDoctorDashboard,
  getDoctorCalendar,
  updateDoctorAvailability
};
