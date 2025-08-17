const mongoose = require('mongoose');

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
  createSearchIndexes
};
