const User = require('../models/User');
const Doctor = require('../models/Doctor');

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile (alias for auth profile)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    // If user is a doctor, include doctor profile
    let doctorProfile = null;
    if (user.role === 'doctor') {
      doctorProfile = await Doctor.findOne({ user: user._id });
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        doctor_profile: doctorProfile ? {
          specialization_name: doctorProfile.specializations?.[0] || 'General',
          experience_years: doctorProfile.experience || 0,
          bio: doctorProfile.bio || '',
          consultation_fee: doctorProfile.consultationFee?.online || 0,
          profileImage: doctorProfile.profileImage
        } : null
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               profile:
 *                 type: object
 *                 properties:
 *                   dateOfBirth:
 *                     type: string
 *                     format: date
 *                   gender:
 *                     type: string
 *                     enum: [male, female, other]
 *                   address:
 *                     type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
const updateUserProfile = async (req, res) => {
  try {
    const { name, phone, profile } = req.body;
    const userId = req.user._id;

    // Check if phone number is already taken by another user
    if (phone) {
      const existingUser = await User.findOne({
        phone,
        _id: { $ne: userId }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Phone number already exists',
          message: 'This phone number is already registered with another account'
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (profile) updateData.profile = { ...req.user.profile, ...profile };

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/users/doctor-profile:
 *   post:
 *     summary: Create or update doctor profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - specializations
 *               - qualifications
 *               - experience
 *               - consultationModes
 *               - consultationFee
 *               - languages
 *             properties:
 *               specializations:
 *                 type: array
 *                 items:
 *                   type: string
 *               qualifications:
 *                 type: array
 *                 items:
 *                   type: object
 *               experience:
 *                 type: number
 *               consultationModes:
 *                 type: array
 *                 items:
 *                   type: string
 *               consultationFee:
 *                 type: object
 *               languages:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Doctor profile created/updated successfully
 *       403:
 *         description: User is not a doctor
 */
const createOrUpdateDoctorProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only users with doctor role can create doctor profiles'
      });
    }
    
    // Ensure user has a name
    const user = await User.findById(userId);
    if (!user || !user.name) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user data',
        message: 'User must have a name before creating a doctor profile'
      });
    }

    const {
      specializations,
      qualifications,
      experience,
      consultationModes,
      consultationFee,
      languages,
      bio,
      clinicDetails,
      availability
    } = req.body;

    // Check if doctor profile already exists
    let doctorProfile = await Doctor.findOne({ user: userId });

    // Get user's name to set in doctor document
    const userName = user.name;
    const doctorName = userName.startsWith('Dr. ') ? userName : `Dr. ${userName}`;
    
    const doctorData = {
      user: userId,
      name: doctorName, // Add name directly to doctor document
      specializations,
      qualifications,
      experience,
      consultationModes,
      consultationFee,
      languages,
      bio,
      clinicDetails,
      availability
    };

    if (doctorProfile) {
      // Update existing profile
      doctorProfile = await Doctor.findByIdAndUpdate(
        doctorProfile._id,
        doctorData,
        { new: true, runValidators: true }
      ).populate('user', 'name email phone');
    } else {
      // Create new profile
      doctorProfile = new Doctor(doctorData);
      await doctorProfile.save();
      await doctorProfile.populate('user', 'name email phone');
    }

    res.json({
      success: true,
      message: doctorProfile.isNew ? 'Doctor profile created successfully' : 'Doctor profile updated successfully',
      data: doctorProfile
    });

  } catch (error) {
    console.error('Create/update doctor profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create/update doctor profile',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/users/doctor-profile:
 *   get:
 *     summary: Get doctor profile for current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctor profile retrieved successfully
 *       404:
 *         description: Doctor profile not found
 */
const getDoctorProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only doctors can access doctor profiles'
      });
    }

    const doctorProfile = await Doctor.findOne({ user: userId })
      .populate('user', 'name email phone');

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        error: 'Doctor profile not found',
        message: 'No doctor profile found for this user'
      });
    }

    res.json({
      success: true,
      message: 'Doctor profile retrieved successfully',
      data: doctorProfile
    });

  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve doctor profile',
      message: error.message
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  createOrUpdateDoctorProfile,
  getDoctorProfile
};
