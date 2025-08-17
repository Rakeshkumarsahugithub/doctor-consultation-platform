const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  slot: {
    startTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
    },
    mode: {
      type: String,
      enum: ['online', 'in-person'],
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'],
    default: 'confirmed'
  },
  bookingType: {
    type: String,
    enum: ['new', 'rescheduled'],
    default: 'new'
  },
  originalAppointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },
  isReschedulable: {
    type: Boolean,
    default: function() {
      const appointmentDateTime = new Date(this.appointmentDate);
      const now = new Date();
      const timeDiff = appointmentDateTime - now;
      return timeDiff > (24 * 60 * 60 * 1000); // 24 hours in milliseconds
    }
  },
  rescheduleDeadline: {
    type: Date,
    default: function() {
      const appointmentDateTime = new Date(this.appointmentDate);
      return new Date(appointmentDateTime.getTime() - (24 * 60 * 60 * 1000));
    }
  },
  consultationFee: {
    type: Number,
    required: true,
    min: [0, 'Fee cannot be negative']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentId: String,
  symptoms: {
    type: String,
    maxlength: [1000, 'Symptoms description cannot exceed 1000 characters']
  },
  notes: {
    patient: {
      type: String,
      maxlength: [500, 'Patient notes cannot exceed 500 characters']
    },
    doctor: {
      type: String,
      maxlength: [1000, 'Doctor notes cannot exceed 1000 characters']
    }
  },
  prescription: {
    medicines: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }],
    lifestyle: String,
    dietRecommendations: String,
    followUpDate: Date
  },
  slotLock: {
    isLocked: {
      type: Boolean,
      default: false
    },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lockedAt: Date,
    expiresAt: Date
  },
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ['patient', 'doctor', 'admin']
    },
    cancelledAt: Date,
    reason: String,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'failed']
    }
  },
  rescheduling: {
    originalDate: Date,
    originalTimeSlot: {
      startTime: String,
      endTime: String
    },
    rescheduledBy: {
      type: String,
      enum: ['patient', 'doctor', 'admin']
    },
    rescheduledAt: Date,
    reason: String
  },
  rating: {
    patientRating: {
      type: Number,
      min: 1,
      max: 5
    },
    patientReview: String,
    doctorRating: {
      type: Number,
      min: 1,
      max: 5
    },
    doctorReview: String
  },
  meetingLink: String,
  remindersSent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
appointmentSchema.index({ patient: 1, appointmentDate: -1 });
appointmentSchema.index({ doctor: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ appointmentDate: 1, 'timeSlot.startTime': 1 });
appointmentSchema.index({ 'slotLock.expiresAt': 1 });

// Virtual for appointment duration in minutes
appointmentSchema.virtual('duration').get(function() {
  if (!this.slot || !this.slot.startTime || !this.slot.endTime) {
    return 30; // Default 30 minutes
  }
  const start = this.slot.startTime.split(':');
  const end = this.slot.endTime.split(':');
  const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
  const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
  return endMinutes - startMinutes;
});

// Virtual for checking if appointment is upcoming
appointmentSchema.virtual('isUpcoming').get(function() {
  if (!this.slot || !this.slot.startTime) {
    return false;
  }
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  const [hours, minutes] = this.slot.startTime.split(':');
  appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  return appointmentDateTime > now && ['confirmed', 'pending'].includes(this.status);
});

// Virtual for checking if cancellation is allowed
appointmentSchema.virtual('canCancel').get(function() {
  if (!['confirmed', 'pending'].includes(this.status)) return false;
  if (!this.slot || !this.slot.startTime) return false;
  
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  const [hours, minutes] = this.slot.startTime.split(':');
  appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  // Allow cancellation if appointment is in the future
  if (appointmentDateTime > now) {
    // Check if appointment was created within the last 24 hours
    if (this.createdAt) {
      const bookingTime = new Date(this.createdAt);
      const hoursSinceBooking = (now - bookingTime) / (1000 * 60 * 60);
      
      // If booked less than 24 hours ago, allow cancellation regardless of appointment time
      if (hoursSinceBooking < 24) {
        return true;
      }
    }
    
    // Otherwise, apply the standard 24-hour rule
    const hoursUntilAppointment = (appointmentDateTime - now) / (1000 * 60 * 60);
    return hoursUntilAppointment >= 24;
  }
  
  return false; // Don't allow cancellation for past appointments
});

// Virtual for checking if rescheduling is allowed
appointmentSchema.virtual('canReschedule').get(function() {
  return this.canCancel; // Same rules as cancellation
});

// Pre-save middleware to set slot lock expiry
appointmentSchema.pre('save', function(next) {
  if (this.isModified('slotLock.isLocked') && this.slotLock.isLocked) {
    const lockDuration = parseInt(process.env.SLOT_LOCK_DURATION_MINUTES) || 5;
    this.slotLock.lockedAt = new Date();
    this.slotLock.expiresAt = new Date(Date.now() + lockDuration * 60 * 1000);
  }
  next();
});

// Method to lock slot
appointmentSchema.methods.lockSlot = function(userId) {
  this.slotLock.isLocked = true;
  this.slotLock.lockedBy = userId;
  return this.save();
};

// Method to release slot lock
appointmentSchema.methods.releaseLock = function() {
  this.slotLock.isLocked = false;
  this.slotLock.lockedBy = undefined;
  this.slotLock.lockedAt = undefined;
  this.slotLock.expiresAt = undefined;
  return this.save();
};

// Method to confirm appointment
appointmentSchema.methods.confirm = function() {
  this.status = 'confirmed';
  this.slotLock.isLocked = false;
  return this.save();
};

// Method to cancel appointment
appointmentSchema.methods.cancel = function(cancelledBy, reason) {
  if (!this.canCancel) {
    throw new Error('Appointment cannot be cancelled within 24 hours of appointment time');
  }
  
  this.status = 'cancelled';
  this.cancellation = {
    cancelledBy,
    cancelledAt: new Date(),
    reason,
    refundAmount: this.consultationFee,
    refundStatus: 'pending'
  };
  
  return this.save();
};

// Static method to find expired locks and release them
appointmentSchema.statics.releaseExpiredLocks = function() {
  return this.updateMany(
    {
      'slotLock.isLocked': true,
      'slotLock.expiresAt': { $lt: new Date() }
    },
    {
      $set: {
        'slotLock.isLocked': false,
        'slotLock.lockedBy': null,
        'slotLock.lockedAt': null,
        'slotLock.expiresAt': null
      }
    }
  );
};

// Static method to find appointments by status
appointmentSchema.statics.findByStatus = function(status, userId, userRole) {
  const query = { status };
  
  if (userRole === 'patient') {
    query.patient = userId;
  } else if (userRole === 'doctor') {
    query.doctor = userId;
  }
  
  return this.find(query)
    .populate('patient', 'name email phone')
    .populate('doctor', 'name user specializations rating')
    .populate('doctor.user', 'name email phone')
    .sort({ appointmentDate: -1, 'timeSlot.startTime': 1 });
};

module.exports = mongoose.model('Appointment', appointmentSchema);
