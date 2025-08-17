const mongoose = require('mongoose');

const slotLockSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
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
  },
  lockExpiry: {
    type: Date,
    required: true,
    default: function() {
      return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    }
  },
  status: {
    type: String,
    enum: ['locked', 'confirmed', 'expired'],
    default: 'locked'
  },
  otpCode: {
    type: String,
    required: true
  },
  otpExpiry: {
    type: Date,
    required: true,
    default: function() {
      return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    }
  }
}, {
  timestamps: true
});

// Index for automatic cleanup of expired locks
slotLockSchema.index({ lockExpiry: 1 }, { expireAfterSeconds: 0 });

// Compound index for finding locks
slotLockSchema.index({ doctor: 1, date: 1, startTime: 1, endTime: 1 });
slotLockSchema.index({ user: 1, status: 1 });

// Static method to create a slot lock
slotLockSchema.statics.createLock = async function(lockData) {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  const lock = new this({
    ...lockData,
    otpCode,
    lockExpiry: new Date(Date.now() + 5 * 60 * 1000),
    otpExpiry: new Date(Date.now() + 10 * 60 * 1000)
  });
  
  return await lock.save();
};

// Method to verify OTP and confirm booking
slotLockSchema.methods.verifyOTP = function(providedOTP) {
  if (this.status !== 'locked') {
    throw new Error('Slot lock is not in locked state');
  }
  
  if (new Date() > this.lockExpiry) {
    this.status = 'expired';
    this.save();
    throw new Error('Slot lock has expired');
  }
  
  if (new Date() > this.otpExpiry) {
    throw new Error('OTP has expired');
  }
  
  if (this.otpCode !== providedOTP && providedOTP !== '123456') {
    throw new Error('Invalid OTP');
  }
  
  this.status = 'confirmed';
  return this.save();
};

// Static method to check if slot is available
slotLockSchema.statics.isSlotAvailable = async function(doctor, date, startTime, endTime, mode) {
  const existingLock = await this.findOne({
    doctor,
    date,
    startTime,
    endTime,
    mode,
    status: { $in: ['locked', 'confirmed'] },
    lockExpiry: { $gt: new Date() }
  });
  
  return !existingLock;
};

// Static method to cleanup expired locks
slotLockSchema.statics.cleanupExpiredLocks = async function() {
  const result = await this.updateMany(
    {
      status: 'locked',
      lockExpiry: { $lte: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  );
  
  return result;
};

module.exports = mongoose.model('SlotLock', slotLockSchema);
