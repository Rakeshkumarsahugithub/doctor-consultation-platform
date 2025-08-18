const { connectDB } = require('../config/database');

// Wrapper function to handle database operations with timeout protection
const withDatabase = (handler) => {
  return async (req, res) => {
    try {
      // Connect to database with timeout
      const connectionTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database connection timeout')), 8000);
      });
      
      const dbConnection = connectDB();
      
      await Promise.race([dbConnection, connectionTimeout]);
      
      // Execute the handler
      return await handler(req, res);
      
    } catch (error) {
      console.error('Database operation failed:', error);
      
      if (error.message.includes('buffering timed out') || 
          error.message.includes('connection timeout') ||
          error.message.includes('server selection timed out')) {
        return res.status(503).json({
          success: false,
          error: 'Service temporarily unavailable',
          message: 'Database connection is currently unavailable. Please try again in a moment.',
          code: 'DB_CONNECTION_TIMEOUT'
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
      });
    }
  };
};

module.exports = { withDatabase };
