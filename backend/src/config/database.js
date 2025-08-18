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

// Global connection cache for Vercel serverless functions
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Optimized MongoDB connection for Vercel
const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 8000, // Slightly increased for better reliability
      socketTimeoutMS: 0, // Disable socket timeout
      connectTimeoutMS: 8000,
      maxPoolSize: 10,
      minPoolSize: 1, // Reduced minimum pool size
      maxIdleTimeMS: 30000,
      bufferCommands: false,
      bufferMaxEntries: 0,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
    };

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongoose) => {
      console.log('MongoDB Connected Successfully');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
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

