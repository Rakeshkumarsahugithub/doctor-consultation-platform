// const mongoose = require('mongoose');

// // Create text indexes for better search performance
// const createSearchIndexes = async () => {
//   try {
//     const db = mongoose.connection.db;
    
//     // Create text index on Doctor collection for full-text search
//     await db.collection('doctors').createIndex({
//       bio: 'text',
//       specializations: 'text',
//       languages: 'text',
//       'qualifications.degree': 'text',
//       'qualifications.institution': 'text'
//     }, {
//       name: 'doctor_search_index',
//       weights: {
//         specializations: 10,
//         bio: 5,
//         'qualifications.degree': 3,
//         languages: 2,
//         'qualifications.institution': 1
//       }
//     });

//     // Create text index on User collection for name search
//     await db.collection('users').createIndex({
//       name: 'text'
//     }, {
//       name: 'user_name_search_index'
//     });

//     // Create compound indexes for common queries
//     await db.collection('doctors').createIndex({
//       isActive: 1,
//       isVerified: 1,
//       'rating.average': -1
//     });

//     await db.collection('doctors').createIndex({
//       specializations: 1,
//       'rating.average': -1
//     });

//     await db.collection('doctors').createIndex({
//       consultationModes: 1,
//       'consultationFee.online': 1
//     });

//     console.log('Search indexes created successfully');
//   } catch (error) {
//     console.error('Error creating search indexes:', error);
//   }
// };

// module.exports = {
//   createSearchIndexes
// };


const mongoose = require('mongoose');

// Disable Mongoose buffering globally for serverless
mongoose.set('bufferCommands', false);
mongoose.set('bufferMaxEntries', 0);

// Global connection cache for Vercel serverless functions
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Optimized MongoDB connection for Vercel
const connectDB = async () => {
  // Return existing connection if available
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Clear any stale connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 0,
      connectTimeoutMS: 5000,
      maxPoolSize: 5, // Reduced for serverless
      minPoolSize: 1,
      maxIdleTimeMS: 10000, // Reduced for serverless
      bufferCommands: false,
      bufferMaxEntries: 0,
      heartbeatFrequencyMS: 30000,
      retryWrites: true,
      authSource: 'admin'
    };

    console.log('Attempting MongoDB connection...');
    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongoose) => {
      console.log('MongoDB Connected Successfully');
      return mongoose;
    }).catch((error) => {
      console.error('MongoDB connection failed:', error);
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    console.error('Database connection error:', e);
    throw new Error(`Database connection failed: ${e.message}`);
  }
};

// Create text indexes for better search performance
const createSearchIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    
    // Create text index on Doctor collection for full-text search
    await db.collection('doctors').createIndex({
      bio: 'text',
      specializations: 'text',
      languages: 'text',
      'qualifications.degree': 'text',
      'qualifications.institution': 'text'
    }, {
      name: 'doctor_search_index',
      weights: {
        specializations: 10,
        bio: 5,
        'qualifications.degree': 3,
        languages: 2,
        'qualifications.institution': 1
      }
    });

    // Create text index on User collection for name search
    await db.collection('users').createIndex({
      name: 'text'
    }, {
      name: 'user_name_search_index'
    });

    // Create compound indexes for common queries
    await db.collection('doctors').createIndex({
      isActive: 1,
      isVerified: 1,
      'rating.average': -1
    });

    await db.collection('doctors').createIndex({
      specializations: 1,
      'rating.average': -1
    });

    await db.collection('doctors').createIndex({
      consultationModes: 1,
      'consultationFee.online': 1
    });

    console.log('Search indexes created successfully');
  } catch (error) {
    console.error('Error creating search indexes:', error);
  }
};

module.exports = {
  connectDB,
  createSearchIndexes
};


