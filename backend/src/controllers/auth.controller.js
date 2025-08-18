// const User = require('../models/User');
// const { generateToken } = require('../middleware/auth');

// /**
//  * @swagger
//  * components:
//  *   schemas:
//  *     User:
//  *       type: object
//  *       required:
//  *         - name
//  *         - email
//  *         - phone
//  *         - password
//  *       properties:
//  *         name:
//  *           type: string
//  *           description: Full name of the user
//  *         email:
//  *           type: string
//  *           format: email
//  *           description: Email address
//  *         phone:
//  *           type: string
//  *           pattern: '^[6-9]\d{9}$'
//  *           description: Indian phone number
//  *         password:
//  *           type: string
//  *           minLength: 6
//  *           description: Password (min 6 characters)
//  *         role:
//  *           type: string
//  *           enum: [patient, doctor, admin]
//  *           default: patient
//  *     AuthResponse:
//  *       type: object
//  *       properties:
//  *         success:
//  *           type: boolean
//  *         message:
//  *           type: string
//  *         data:
//  *           type: object
//  *           properties:
//  *             user:
//  *               $ref: '#/components/schemas/User'
//  *             token:
//  *               type: string
//  */

// /**
//  * @swagger
//  * /api/auth/register:
//  *   post:
//  *     summary: Register a new user
//  *     tags: [Authentication]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - name
//  *               - email
//  *               - phone
//  *               - password
//  *             properties:
//  *               name:
//  *                 type: string
//  *               email:
//  *                 type: string
//  *                 format: email
//  *               phone:
//  *                 type: string
//  *               password:
//  *                 type: string
//  *               role:
//  *                 type: string
//  *                 enum: [patient, doctor]
//  *     responses:
//  *       201:
//  *         description: User registered successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/AuthResponse'
//  *       400:
//  *         description: Validation error or user already exists
//  *       500:
//  *         description: Internal server error
//  */
// const register = async (req, res) => {
//   try {
//     console.log('Registration request received:', req.body);
//     const { name, email, phone, password, role } = req.body;

//     // Check if user already exists
//     const existingUser = await User.findOne({
//       $or: [{ email }, ...(phone ? [{ phone }] : [])]
//     });

//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         error: 'User already exists',
//         message: existingUser.email === email 
//           ? 'Email is already registered' 
//           : 'Phone number is already registered'
//       });
//     }

//     // Create new user
//     const userData = {
//       name,
//       email,
//       password,
//       role: role || 'patient'
//     };
    
//     // Only add phone if it's provided and not empty
//     if (phone && phone.trim() !== '') {
//       userData.phone = phone;
//     }
    
//     const user = new User(userData);

//     await user.save();

//     // Generate JWT token
//     const token = generateToken(user._id);

//     // Update last login
//     await user.updateLastLogin();

//     // Remove password from response
//     const userResponse = user.toObject();
//     delete userResponse.password;

//     res.status(201).json({
//       success: true,
//       message: 'User registered successfully',
//       data: {
//         user: userResponse,
//         token
//       }
//     });

//   } catch (error) {
//     console.error('Registration error:', error);
//     console.error('Error stack:', error.stack);
//     res.status(500).json({
//       success: false,
//       error: 'Registration failed',
//       message: error.message,
//       details: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     });
//   }
// };

// /**
//  * @swagger
//  * /api/auth/login:
//  *   post:
//  *     summary: Login user
//  *     tags: [Authentication]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - email
//  *               - password
//  *             properties:
//  *               email:
//  *                 type: string
//  *                 format: email
//  *               password:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Login successful
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/AuthResponse'
//  *       400:
//  *         description: Invalid credentials
//  *       500:
//  *         description: Internal server error
//  */
// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Find user and include password for comparison
//     const user = await User.findOne({ email }).select('+password');

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid credentials',
//         message: 'Email or password is incorrect'
//       });
//     }

//     // Check if account is active
//     if (!user.isActive) {
//       return res.status(400).json({
//         success: false,
//         error: 'Account deactivated',
//         message: 'Your account has been deactivated. Please contact support.'
//       });
//     }

//     // Verify password
//     const isPasswordValid = await user.comparePassword(password);

//     if (!isPasswordValid) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid credentials',
//         message: 'Email or password is incorrect'
//       });
//     }

//     // Generate JWT token
//     const token = generateToken(user._id);

//     // Update last login
//     await user.updateLastLogin();

//     // Remove password from response
//     const userResponse = user.toObject();
//     delete userResponse.password;

//     res.json({
//       success: true,
//       message: 'Login successful',
//       data: {
//         user: userResponse,
//         token
//       }
//     });

//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Login failed',
//       message: error.message
//     });
//   }
// };

// /**
//  * @swagger
//  * /api/auth/profile:
//  *   get:
//  *     summary: Get current user profile
//  *     tags: [Authentication]
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Profile retrieved successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                 data:
//  *                   $ref: '#/components/schemas/User'
//  *       401:
//  *         description: Unauthorized
//  */
// const getProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         error: 'User not found',
//         message: 'User profile not found'
//       });
//     }

//     res.json({
//       success: true,
//       message: 'Profile retrieved successfully',
//       data: user
//     });

//   } catch (error) {
//     console.error('Get profile error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to retrieve profile',
//       message: error.message
//     });
//   }
// };

// /**
//  * @swagger
//  * /api/auth/profile:
//  *   put:
//  *     summary: Update user profile
//  *     tags: [Authentication]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               name:
//  *                 type: string
//  *               phone:
//  *                 type: string
//  *               profile:
//  *                 type: object
//  *     responses:
//  *       200:
//  *         description: Profile updated successfully
//  *       400:
//  *         description: Validation error
//  *       401:
//  *         description: Unauthorized
//  */
// const updateProfile = async (req, res) => {
//   try {
//     const { name, phone, profile } = req.body;
//     const userId = req.user._id;

//     // Check if phone number is already taken by another user
//     if (phone) {
//       const existingUser = await User.findOne({
//         phone,
//         _id: { $ne: userId }
//       });

//       if (existingUser) {
//         return res.status(400).json({
//           success: false,
//           error: 'Phone number already exists',
//           message: 'This phone number is already registered with another account'
//         });
//       }
//     }

//     const updateData = {};
//     if (name) updateData.name = name;
//     if (phone) updateData.phone = phone;
//     if (profile) updateData.profile = { ...req.user.profile, ...profile };

//     const user = await User.findByIdAndUpdate(
//       userId,
//       updateData,
//       { new: true, runValidators: true }
//     );

//     res.json({
//       success: true,
//       message: 'Profile updated successfully',
//       data: user
//     });

//   } catch (error) {
//     console.error('Update profile error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to update profile',
//       message: error.message
//     });
//   }
// };

// /**
//  * @swagger
//  * /api/auth/change-password:
//  *   put:
//  *     summary: Change user password
//  *     tags: [Authentication]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - currentPassword
//  *               - newPassword
//  *             properties:
//  *               currentPassword:
//  *                 type: string
//  *               newPassword:
//  *                 type: string
//  *                 minLength: 6
//  *     responses:
//  *       200:
//  *         description: Password changed successfully
//  *       400:
//  *         description: Invalid current password
//  *       401:
//  *         description: Unauthorized
//  */
// const changePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;
//     const userId = req.user._id;

//     // Get user with password
//     const user = await User.findById(userId).select('+password');

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         error: 'User not found',
//         message: 'User not found'
//       });
//     }

//     // Verify current password
//     const isCurrentPasswordValid = await user.comparePassword(currentPassword);

//     if (!isCurrentPasswordValid) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid password',
//         message: 'Current password is incorrect'
//       });
//     }

//     // Update password
//     user.password = newPassword;
//     await user.save();

//     res.json({
//       success: true,
//       message: 'Password changed successfully'
//     });

//   } catch (error) {
//     console.error('Change password error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to change password',
//       message: error.message
//     });
//   }
// };

// /**
//  * @swagger
//  * /api/auth/logout:
//  *   post:
//  *     summary: Logout user (client-side token removal)
//  *     tags: [Authentication]
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Logout successful
//  */
// const logout = async (req, res) => {
//   // Since we're using stateless JWT, logout is handled client-side
//   // This endpoint is mainly for consistency and future token blacklisting
//   res.json({
//     success: true,
//     message: 'Logout successful. Please remove the token from client storage.'
//   });
// };

// module.exports = {
//   register,
//   login,
//   getProfile,
//   updateProfile,
//   changePassword,
//   logout
// };








const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { withDatabase } = require('../utils/serverless-db');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - phone
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: Full name of the user
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *         phone:
 *           type: string
 *           pattern: '^[6-9]\d{9}$'
 *           description: Indian phone number
 *         password:
 *           type: string
 *           minLength: 6
 *           description: Password (min 6 characters)
 *         role:
 *           type: string
 *           enum: [patient, doctor, admin]
 *           default: patient
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             token:
 *               type: string
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [patient, doctor]
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error or user already exists
 *       500:
 *         description: Internal server error
 */
const registerHandler = async (req, res) => {
  console.log('Registration request received:', req.body);
  const { name, email, phone, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, ...(phone ? [{ phone }] : [])]
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'User already exists',
      message: existingUser.email === email 
        ? 'Email is already registered' 
        : 'Phone number is already registered'
    });
  }

  // Create new user
  const userData = {
    name,
    email,
    password,
    role: role || 'patient'
  };
  
  // Only add phone if it's provided and not empty
  if (phone && phone.trim() !== '') {
    userData.phone = phone;
  }
  
  const user = new User(userData);

  await user.save();

  // Generate JWT token
  const token = generateToken(user._id);

  // Update last login
  await user.updateLastLogin();

  // Remove password from response
  const userResponse = user.toObject();
  delete userResponse.password;

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: userResponse,
      token
    }
  });
};

const register = withDatabase(registerHandler);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
const loginHandler = async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(400).json({
      success: false,
      error: 'Invalid credentials',
      message: 'Email or password is incorrect'
    });
  }

  // Check if account is active
  if (!user.isActive) {
    return res.status(400).json({
      success: false,
      error: 'Account deactivated',
      message: 'Your account has been deactivated. Please contact support.'
    });
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return res.status(400).json({
      success: false,
      error: 'Invalid credentials',
      message: 'Email or password is incorrect'
    });
  }

  // Generate JWT token
  const token = generateToken(user._id);

  // Update last login
  await user.updateLastLogin();

  // Remove password from response
  const userResponse = user.toObject();
  delete userResponse.password;

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userResponse,
      token
    }
  });
};

const login = withDatabase(loginHandler);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
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
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
const updateProfile = async (req, res) => {
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
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid current password
 *       401:
 *         description: Unauthorized
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Get user with password
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid password',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user (client-side token removal)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
const logout = async (req, res) => {
  // Since we're using stateless JWT, logout is handled client-side
  // This endpoint is mainly for consistency and future token blacklisting
  res.json({
    success: true,
    message: 'Logout successful. Please remove the token from client storage.'
  });
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout
};




