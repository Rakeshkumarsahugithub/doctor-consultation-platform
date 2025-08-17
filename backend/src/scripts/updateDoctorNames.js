const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
require('dotenv').config();

const updateDoctorNames = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all doctors
    const doctors = await Doctor.find().populate('user');
    console.log(`Found ${doctors.length} doctor records`);

    let updatedCount = 0;

    for (const doctor of doctors) {
      // Check if doctor has a user reference with a name
      if (doctor.user && doctor.user.name) {
        // Add the name directly to the doctor document
        const name = doctor.user.name.startsWith('Dr. ') ? doctor.user.name : `Dr. ${doctor.user.name}`;
        
        // Update the doctor document with the name
        await Doctor.findByIdAndUpdate(doctor._id, { name });
        
        console.log(`Updated doctor ${doctor._id} with name: ${name}`);
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} doctor records with direct name field`);
    console.log('Done!');

  } catch (error) {
    console.error('Error updating doctor names:', error);
  } finally {
    mongoose.connection.close();
  }
};

updateDoctorNames();