const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    trim: true,
    required: [true, 'Doctor name is required']
  },
  specializations: [{
    type: String,
    required: true,
    enum: [
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
    ]
  }],
  qualifications: [{
    degree: {
      type: String,
      required: true
    },
    institution: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      required: true
    }
  }],
  experience: {
    type: Number,
    required: [true, 'Experience in years is required'],
    min: [0, 'Experience cannot be negative']
  },
  consultationModes: [{
    type: String,
    enum: ['online', 'in-person'],
    required: true
  }],
  consultationFee: {
    online: {
      type: Number,
      required: function() {
        return this.consultationModes.includes('online');
      },
      min: [0, 'Fee cannot be negative']
    },
    inPerson: {
      type: Number,
      required: function() {
        return this.consultationModes.includes('in-person');
      },
      min: [0, 'Fee cannot be negative']
    }
  },
  languages: [{
    type: String,
    required: true
  }],
  clinicDetails: {
    name: String,
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: {
        type: String,
        default: 'India'
      }
    },
    phone: String
  },
  availability: {
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    schedule: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        required: true
      },
      slots: [{
        startTime: {
          type: String,
          required: true,
          match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
        },
        endTime: {
          type: String,
          required: true,
          match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
        },
        mode: {
          type: String,
          enum: ['online', 'in-person'],
          required: true
        }
      }]
    }]
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  profileImage: {
    type: String,
    default: 'https://via.placeholder.com/150x150?text=Doctor'
  },
  bio: {
    type: String,
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalConsultations: {
    type: Number,
    default: 0,
    min: 0
  },
  nextAvailableSlot: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
doctorSchema.index({ specializations: 1 });
doctorSchema.index({ consultationModes: 1 });
doctorSchema.index({ 'rating.average': -1 });
doctorSchema.index({ isActive: 1, isVerified: 1 });
doctorSchema.index({ nextAvailableSlot: 1 });

// Virtual populate for user details
doctorSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Virtual for full name from user is no longer needed as we now store the name directly
// doctorSchema.virtual('name').get(function() {
//   return this.userDetails ? this.userDetails.name : '';
// });

// Method to update rating
doctorSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Method to increment consultation count
doctorSchema.methods.incrementConsultations = function() {
  this.totalConsultations += 1;
  return this.save();
};

// Static method to find available doctors
doctorSchema.statics.findAvailable = function(filters = {}) {
  const query = {
    isActive: true,
    isVerified: true,
    ...filters
  };
  
  return this.find(query)
    .populate('user', 'name email phone')
    .sort({ 'rating.average': -1, nextAvailableSlot: 1 });
};

// Method to get next available slots
doctorSchema.methods.getAvailableSlots = function(date, mode) {
  // This would integrate with a slot management system
  // For now, return mock slots based on availability schedule
  const dayOfWeek = new Date(date).toLocaleLowerCase().slice(0, 3);
  const daySchedule = this.availability.schedule.find(s => 
    s.day.startsWith(dayOfWeek)
  );
  
  if (!daySchedule) return [];
  
  return daySchedule.slots
    .filter(slot => !mode || slot.mode === mode)
    .map(slot => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      mode: slot.mode,
      available: true // This would check against booked appointments
    }));
};

module.exports = mongoose.model('Doctor', doctorSchema);
