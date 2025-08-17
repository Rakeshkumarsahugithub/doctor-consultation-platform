const Joi = require('joi');

// Validation schemas
const schemas = {
  // User registration validation
  registerUser: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().lowercase().required(),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).allow('', null).optional(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('patient', 'doctor').default('patient')
  }),

  // User login validation
  loginUser: Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().required()
  }),

  // Doctor profile validation
  doctorProfile: Joi.object({
    specializations: Joi.array().items(
      Joi.string().valid(
        'General Medicine', 'Panchakarma', 'Ayurvedic Nutrition',
        'Herbal Medicine', 'Pulse Diagnosis', 'Yoga Therapy',
        'Meditation', 'Skin & Hair Care', 'Women\'s Health',
        'Digestive Health', 'Mental Wellness', 'Joint & Bone Care'
      )
    ).min(1).required(),
    qualifications: Joi.array().items(
      Joi.object({
        degree: Joi.string().required(),
        institution: Joi.string().required(),
        year: Joi.number().integer().min(1950).max(new Date().getFullYear()).required()
      })
    ).min(1).required(),
    experience: Joi.number().integer().min(0).required(),
    consultationModes: Joi.array().items(
      Joi.string().valid('online', 'in-person')
    ).min(1).required(),
    consultationFee: Joi.object({
      online: Joi.number().min(0).when('consultationModes', {
        is: Joi.array().items(Joi.string().valid('online')),
        then: Joi.required()
      }),
      inPerson: Joi.number().min(0).when('consultationModes', {
        is: Joi.array().items(Joi.string().valid('in-person')),
        then: Joi.required()
      })
    }),
    languages: Joi.array().items(Joi.string()).min(1).required(),
    bio: Joi.string().max(1000).optional()
  }),

  // Appointment booking validation
  bookAppointment: Joi.object({
    doctorId: Joi.string().hex().length(24).required(),
    appointmentDate: Joi.date().min('now').required(),
    timeSlot: Joi.object({
      startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
    }).required(),
    consultationMode: Joi.string().valid('online', 'in-person').required(),
    symptoms: Joi.string().max(1000).optional(),
    notes: Joi.string().max(500).optional()
  }),

  // Appointment update validation
  updateAppointment: Joi.object({
    status: Joi.string().valid('confirmed', 'completed', 'cancelled', 'rescheduled').optional(),
    notes: Joi.object({
      patient: Joi.string().max(500).optional(),
      doctor: Joi.string().max(1000).optional()
    }).optional(),
    prescription: Joi.object({
      medicines: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          dosage: Joi.string().required(),
          frequency: Joi.string().required(),
          duration: Joi.string().required(),
          instructions: Joi.string().optional()
        })
      ).optional(),
      lifestyle: Joi.string().optional(),
      dietRecommendations: Joi.string().optional(),
      followUpDate: Joi.date().optional()
    }).optional()
  }),

  // Query parameters validation
  queryParams: {
    pagination: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10)
    }),
    
    doctorSearch: Joi.object({
      specialization: Joi.string().allow('').optional(),
      mode: Joi.string().valid('online', 'in-person', '').optional(),
      minRating: Joi.alternatives().try(
        Joi.number().min(0).max(5),
        Joi.string().allow('')
      ).optional(),
      maxFee: Joi.alternatives().try(
        Joi.number().min(0),
        Joi.string().allow('')
      ).optional(),
      search: Joi.string().allow('').optional(),
      sortBy: Joi.string().valid('rating', 'experience', 'fee', 'availability', 'reviews', 'name').default('rating'),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
      page: Joi.alternatives().try(
        Joi.number().integer().min(1),
        Joi.string().pattern(/^\d+$/)
      ).default(1),
      limit: Joi.alternatives().try(
        Joi.number().integer().min(1).max(100),
        Joi.string().pattern(/^\d+$/)
      ).default(10)
    }),

    appointmentFilter: Joi.object({
      status: Joi.string().valid('pending', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'booked').optional(),
      startDate: Joi.date().optional(),
      endDate: Joi.date().optional(),
      doctorId: Joi.string().hex().length(24).optional(),
      page: Joi.alternatives().try(
        Joi.number().integer().min(1),
        Joi.string().pattern(/^\d+$/)
      ).default(1),
      limit: Joi.alternatives().try(
        Joi.number().integer().min(1).max(100),
        Joi.string().pattern(/^\d+$/)
      ).default(10)
    })
  }
};

// Validation middleware factory
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    console.log(`Validating ${source}:`, req[source]);
    const data = req[source];
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: false, // Keep all fields, don't strip unknown ones
      convert: true
    });

    if (error) {
      console.log('Validation error:', error.details);
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors
      });
    }

    // Merge validated data with original to preserve all fields
    req[source] = { ...data, ...value };
    console.log('Validation passed, cleaned data:', req[source]);
    next();
  };
};

// Specific validation middlewares
const validateRegistration = validate(schemas.registerUser);
const validateLogin = validate(schemas.loginUser);
const validateDoctorProfile = validate(schemas.doctorProfile);
const validateBookAppointment = validate(schemas.bookAppointment);
const validateUpdateAppointment = validate(schemas.updateAppointment);
const validatePagination = validate(schemas.queryParams.pagination, 'query');
const validateDoctorSearch = validate(schemas.queryParams.doctorSearch, 'query');
const validateAppointmentFilter = validate(schemas.queryParams.appointmentFilter, 'query');

// Custom validation for MongoDB ObjectId
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid ${paramName} format`
      });
    }
    
    next();
  };
};

// Validate time slot format and logic
const validateTimeSlot = (req, res, next) => {
  const { timeSlot } = req.body;
  
  if (!timeSlot) return next();
  
  const { startTime, endTime } = timeSlot;
  
  // Convert time strings to minutes for comparison
  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  if (startMinutes >= endMinutes) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'End time must be after start time'
    });
  }
  
  // Check if slot duration is reasonable (15 minutes to 2 hours)
  const duration = endMinutes - startMinutes;
  if (duration < 15 || duration > 120) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Appointment duration must be between 15 minutes and 2 hours'
    });
  }
  
  next();
};

module.exports = {
  schemas,
  validate,
  validateRegistration,
  validateLogin,
  validateDoctorProfile,
  validateBookAppointment,
  validateUpdateAppointment,
  validatePagination,
  validateDoctorSearch,
  validateAppointmentFilter,
  validateObjectId,
  validateTimeSlot
};
