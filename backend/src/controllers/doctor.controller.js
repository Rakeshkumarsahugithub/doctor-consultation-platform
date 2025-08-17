const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

/**
 * @swagger
 * components:
 *   schemas:
 *     Doctor:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         specializations:
 *           type: array
 *           items:
 *             type: string
 *         experience:
 *           type: number
 *         consultationModes:
 *           type: array
 *           items:
 *             type: string
 *             enum: [online, in-person]
 *         consultationFee:
 *           type: object
 *           properties:
 *             online:
 *               type: number
 *             inPerson:
 *               type: number
 *         rating:
 *           type: object
 *           properties:
 *             average:
 *               type: number
 *             count:
 *               type: number
 */

/**
 * @swagger
 * /api/doctors/specializations:
 *   get:
 *     summary: Get all available specializations
 *     tags: [Doctors]
 *     responses:
 *       200:
 *         description: List of specializations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 */
const getSpecializations = async (req, res) => {
  try {
    const specializations = [
      'General Medicine',
      'Panchakarma',
      'Ayurvedic Nutrition',
      'Herbal Medicine',
      'Pulse Diagnosis',
      'Yoga Therapy',
      'Meditation',
      'Skin & Hair Care',
      'Women\'s Health',
      'Digestive Health',
      'Mental Wellness',
      'Joint & Bone Care'
    ];

    res.json({
      success: true,
      message: 'Specializations retrieved successfully',
      data: specializations
    });
  } catch (error) {
    console.error('Get specializations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve specializations',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/doctors:
 *   get:
 *     summary: Search and filter doctors
 *     tags: [Doctors]
 *     parameters:
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *         description: Filter by specialization
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [online, in-person]
 *         description: Filter by consultation mode
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *         description: Minimum rating filter
 *       - in: query
 *         name: maxFee
 *         schema:
 *           type: number
 *         description: Maximum fee filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [rating, experience, fee, availability]
 *         description: Sort by field
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of doctors
 */
const searchDoctors = async (req, res) => {
  try {
    const {
      specialization,
      mode,
      minRating,
      maxFee,
      search,
      sortBy = 'rating',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build filter query
    const filter = {
      isActive: true,
      isVerified: true
    };

    // Handle specialization filter (ignore empty strings)
    if (specialization && specialization.trim() !== '') {
      filter.specializations = { $in: [specialization.trim()] };
    }

    // Handle consultation mode filter (ignore empty strings)
    if (mode && mode.trim() !== '') {
      filter.consultationModes = { $in: [mode.trim()] };
    }

    // Remove the $or filter for search - we'll handle it in aggregation pipeline

    // Handle rating filter (ignore empty strings and invalid numbers)
    if (minRating && minRating !== '' && !isNaN(parseFloat(minRating))) {
      filter['rating.average'] = { $gte: parseFloat(minRating) };
    }

    // Handle fee filter (ignore empty strings and invalid numbers)
    if (maxFee && maxFee !== '' && !isNaN(parseFloat(maxFee))) {
      const feeValue = parseFloat(maxFee);
      const feeFilter = {};
      if (mode === 'online') {
        feeFilter['consultationFee.online'] = { $lte: feeValue };
      } else if (mode === 'in-person') {
        feeFilter['consultationFee.inPerson'] = { $lte: feeValue };
      } else {
        feeFilter.$or = [
          { 'consultationFee.online': { $lte: feeValue } },
          { 'consultationFee.inPerson': { $lte: feeValue } }
        ];
      }
      Object.assign(filter, feeFilter);
    }

    // Build sort query
    const sortQuery = {};
    switch (sortBy) {
      case 'rating':
        sortQuery['rating.average'] = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'experience':
        sortQuery.experience = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'fee':
        if (mode === 'online') {
          sortQuery['consultationFee.online'] = sortOrder === 'asc' ? 1 : -1;
        } else if (mode === 'in-person') {
          sortQuery['consultationFee.inPerson'] = sortOrder === 'asc' ? 1 : -1;
        } else {
          sortQuery['consultationFee.online'] = sortOrder === 'asc' ? 1 : -1;
        }
        break;
      case 'name':
        sortQuery.name = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'reviews':
        sortQuery['rating.count'] = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'availability':
        sortQuery.nextAvailableSlot = sortOrder === 'asc' ? 1 : -1;
        break;
      default:
        sortQuery['rating.average'] = -1;
    }

    // Calculate pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 10, 100); // Cap at 100
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination with search consideration
    let total;
    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      total = await Doctor.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $match: {
            ...filter,
            $or: [
              { 'user.name': { $regex: searchTerm, $options: 'i' } },
              { name: { $regex: searchTerm, $options: 'i' } },
              { bio: { $regex: searchTerm, $options: 'i' } },
              { specializations: { $regex: searchTerm, $options: 'i' } },
              { languages: { $regex: searchTerm, $options: 'i' } },
              { 'qualifications.degree': { $regex: searchTerm, $options: 'i' } },
              { 'qualifications.institution': { $regex: searchTerm, $options: 'i' } }
            ]
          }
        },
        {
          $count: "total"
        }
      ]);
      total = total.length > 0 ? total[0].total : 0;
    } else {
      total = await Doctor.countDocuments(filter);
    }

    // Execute query with improved search logic
    let doctors;
    
    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      
      // Use aggregation pipeline with regex search (more reliable than text search)
      doctors = await Doctor.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $match: {
            ...filter,
            $or: [
              { 'user.name': { $regex: searchTerm, $options: 'i' } },
              { name: { $regex: searchTerm, $options: 'i' } },
              { bio: { $regex: searchTerm, $options: 'i' } },
              { specializations: { $regex: searchTerm, $options: 'i' } },
              { languages: { $regex: searchTerm, $options: 'i' } },
              { 'qualifications.degree': { $regex: searchTerm, $options: 'i' } },
              { 'qualifications.institution': { $regex: searchTerm, $options: 'i' } }
            ]
          }
        },
        {
          $sort: sortQuery
        },
        {
          $skip: skip
        },
        {
          $limit: limitNum
        }
      ]);
    } else {
      // Regular query without search
      doctors = await Doctor.find(filter)
        .populate('user', 'name email phone profileImage')
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum);
      
      doctors = doctors.map(doc => doc.toObject());
    }

    // Calculate next available slot for each doctor
    const doctorsWithAvailability = await Promise.all(
      doctors.map(async (doctor) => {
        const doctorObj = doctor._id ? doctor : doctor.toObject();
        
        // Get next available appointment slot
        const nextSlot = await getNextAvailableSlot(doctorObj._id, mode);
        doctorObj.nextAvailableSlot = nextSlot;
        
        return doctorObj;
      })
    );

    res.json({
      success: true,
      message: 'Doctors retrieved successfully',
      data: {
        doctors: doctorsWithAvailability,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        },
        filters: {
          specialization,
          mode,
          minRating,
          maxFee,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error('Search doctors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search doctors',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/doctors/{id}:
 *   get:
 *     summary: Get doctor details by ID
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Doctor details
 *       404:
 *         description: Doctor not found
 */
const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findById(id)
      .populate('user', 'name email phone profileImage');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found',
        message: 'Doctor with this ID does not exist'
      });
    }

    if (!doctor.isActive || !doctor.isVerified) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not available',
        message: 'Doctor is not currently available for consultations'
      });
    }

    // Get doctor's recent reviews
    const recentAppointments = await Appointment.find({
      doctor: id,
      status: 'completed',
      'rating.patientRating': { $exists: true }
    })
    .populate('patient', 'name')
    .sort({ updatedAt: -1 })
    .limit(5);

    const reviews = recentAppointments.map(apt => ({
      patientName: apt.patient.name,
      rating: apt.rating.patientRating,
      review: apt.rating.patientReview,
      date: apt.updatedAt
    }));

    const doctorWithReviews = {
      ...doctor.toObject(),
      reviews
    };

    res.json({
      success: true,
      message: 'Doctor details retrieved successfully',
      data: doctorWithReviews
    });

  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve doctor details',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/doctors/{id}/availability:
 *   get:
 *     summary: Get doctor's availability for a specific date
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to check availability (YYYY-MM-DD)
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [online, in-person]
 *         description: Consultation mode
 *     responses:
 *       200:
 *         description: Available time slots
 */
const getDoctorAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, mode } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date is required',
        message: 'Please provide a date to check availability'
      });
    }

    const doctor = await Doctor.findById(id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found',
        message: 'Doctor with this ID does not exist'
      });
    }

    // Get day of week for the requested date
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Find doctor's schedule for this day
    const daySchedule = doctor.availability.schedule.find(s => s.day === dayOfWeek);

    if (!daySchedule || !daySchedule.slots.length) {
      return res.json({
        success: true,
        message: 'No availability for this date',
        data: {
          date,
          availableSlots: []
        }
      });
    }

    // Filter slots by mode if specified
    let availableSlots = daySchedule.slots;
    if (mode) {
      availableSlots = availableSlots.filter(slot => slot.mode === mode);
    }

    // Get existing appointments for this date
    const existingAppointments = await Appointment.find({
      doctor: id,
      appointmentDate: {
        $gte: new Date(date + 'T00:00:00.000Z'),
        $lt: new Date(date + 'T23:59:59.999Z')
      },
      status: { $in: ['pending', 'confirmed'] }
    });

    // Check slot locks
    const lockedSlots = await Appointment.find({
      doctor: id,
      appointmentDate: {
        $gte: new Date(date + 'T00:00:00.000Z'),
        $lt: new Date(date + 'T23:59:59.999Z')
      },
      'slotLock.isLocked': true,
      'slotLock.expiresAt': { $gt: new Date() }
    });

    // Mark slots as unavailable if booked or locked
    const slotsWithAvailability = availableSlots.map(slot => {
      const isBooked = existingAppointments.some(apt => 
        apt.slot && apt.slot.startTime === slot.startTime && 
        apt.slot.endTime === slot.endTime
      );

      const isLocked = lockedSlots.some(apt => 
        apt.slotLock && apt.slot && apt.slot.startTime === slot.startTime && 
        apt.slot.endTime === slot.endTime
      );

      return {
        startTime: slot.startTime,
        endTime: slot.endTime,
        mode: slot.mode,
        available: !isBooked && !isLocked,
        fee: slot.mode === 'online' ? doctor.consultationFee.online : doctor.consultationFee.inPerson
      };
    });

    res.json({
      success: true,
      message: 'Availability retrieved successfully',
      data: {
        date,
        doctorId: id,
        availableSlots: slotsWithAvailability
      }
    });

  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve availability',
      message: error.message
    });
  }
};

// Helper function to get next available slot
const getNextAvailableSlot = async (doctorId, mode = null) => {
  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return null;

    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Check each day in the next week
    for (let d = new Date(today); d <= nextWeek; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const daySchedule = doctor.availability.schedule.find(s => s.day === dayOfWeek);

      if (!daySchedule) continue;

      let slots = daySchedule.slots;
      if (mode) {
        slots = slots.filter(slot => slot.mode === mode);
      }

      // Check if any slot is available
      for (const slot of slots) {
        const dateStr = d.toISOString().split('T')[0];
        
        // Check if slot is booked
        const isBooked = await Appointment.findOne({
          doctor: doctorId,
          appointmentDate: {
            $gte: new Date(dateStr + 'T00:00:00.000Z'),
            $lt: new Date(dateStr + 'T23:59:59.999Z')
          },
          'timeSlot.startTime': slot.startTime,
          'timeSlot.endTime': slot.endTime,
          status: { $in: ['pending', 'confirmed'] }
        });

        if (!isBooked) {
          return {
            date: dateStr,
            startTime: slot.startTime,
            endTime: slot.endTime,
            mode: slot.mode
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Get next available slot error:', error);
    return null;
  }
};

module.exports = {
  getSpecializations,
  searchDoctors,
  getDoctorById,
  getDoctorAvailability
};
