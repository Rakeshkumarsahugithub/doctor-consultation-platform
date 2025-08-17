const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});

    // Create sample users
    console.log('Creating sample users...');
    
    // Create patients
    const patients = await User.create([
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        password: 'password123',
        role: 'patient',
        profile: {
          dateOfBirth: new Date('1990-05-15'),
          gender: 'male',
          address: {
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India'
          }
        }
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '9876543211',
        password: 'password123',
        role: 'patient',
        profile: {
          dateOfBirth: new Date('1985-08-22'),
          gender: 'female',
          address: {
            city: 'Delhi',
            state: 'Delhi',
            country: 'India'
          }
        }
      }
    ]);

    // Create doctor users
    const doctorUsers = await User.create([
      {
        name: 'Dr. Rajesh Kumar',
        email: 'rajesh@example.com',
        phone: '9876543212',
        password: 'password123',
        role: 'doctor'
      },
      {
        name: 'Dr. Priya Sharma',
        email: 'priya@example.com',
        phone: '9876543213',
        password: 'password123',
        role: 'doctor'
      },
      {
        name: 'Dr. Amit Patel',
        email: 'amit@example.com',
        phone: '9876543214',
        password: 'password123',
        role: 'doctor'
      },
      {
        name: 'Dr. Sunita Gupta',
        email: 'sunita@example.com',
        phone: '9876543215',
        password: 'password123',
        role: 'doctor'
      }
    ]);

    console.log('Creating doctor profiles...');
    
    // Create doctor profiles
    const doctors = await Doctor.create([
      {
        user: doctorUsers[0]._id,
        specializations: ['General Medicine', 'Panchakarma'],
        qualifications: [
          { degree: 'BAMS', institution: 'Gujarat Ayurved University', year: 2010 },
          { degree: 'MD (Ayurveda)', institution: 'Rajiv Gandhi University', year: 2013 }
        ],
        experience: 11,
        consultationModes: ['online', 'in-person'],
        consultationFee: {
          online: 500,
          inPerson: 800
        },
        languages: ['Hindi', 'English', 'Gujarati'],
        bio: 'Experienced Ayurvedic physician specializing in Panchakarma treatments and general wellness.',
        rating: { average: 4.5, count: 25 },
        isVerified: true,
        isActive: true,
        totalConsultations: 150,
        availability: {
          schedule: [
            {
              day: 'monday',
              slots: [
                { startTime: '09:00', endTime: '09:30', mode: 'online' },
                { startTime: '09:30', endTime: '10:00', mode: 'online' },
                { startTime: '10:00', endTime: '10:30', mode: 'online' },
                { startTime: '14:00', endTime: '14:30', mode: 'in-person' },
                { startTime: '14:30', endTime: '15:00', mode: 'in-person' },
                { startTime: '15:00', endTime: '15:30', mode: 'in-person' }
              ]
            },
            {
              day: 'tuesday',
              slots: [
                { startTime: '10:00', endTime: '10:30', mode: 'online' },
                { startTime: '10:30', endTime: '11:00', mode: 'online' },
                { startTime: '11:00', endTime: '11:30', mode: 'online' },
                { startTime: '15:00', endTime: '15:30', mode: 'in-person' },
                { startTime: '15:30', endTime: '16:00', mode: 'in-person' }
              ]
            },
            {
              day: 'wednesday',
              slots: [
                { startTime: '09:00', endTime: '09:30', mode: 'online' },
                { startTime: '09:30', endTime: '10:00', mode: 'online' },
                { startTime: '14:00', endTime: '14:30', mode: 'in-person' },
                { startTime: '14:30', endTime: '15:00', mode: 'in-person' }
              ]
            },
            {
              day: 'thursday',
              slots: [
                { startTime: '10:00', endTime: '10:30', mode: 'online' },
                { startTime: '10:30', endTime: '11:00', mode: 'online' },
                { startTime: '16:00', endTime: '16:30', mode: 'in-person' },
                { startTime: '16:30', endTime: '17:00', mode: 'in-person' }
              ]
            },
            {
              day: 'friday',
              slots: [
                { startTime: '09:00', endTime: '09:30', mode: 'online' },
                { startTime: '09:30', endTime: '10:00', mode: 'online' },
                { startTime: '15:00', endTime: '15:30', mode: 'in-person' },
                { startTime: '15:30', endTime: '16:00', mode: 'in-person' }
              ]
            },
            {
              day: 'saturday',
              slots: [
                { startTime: '08:00', endTime: '08:30', mode: 'online' },
                { startTime: '08:30', endTime: '09:00', mode: 'online' },
                { startTime: '09:00', endTime: '09:30', mode: 'online' }
              ]
            }
          ]
        }
      },
      {
        user: doctorUsers[1]._id,
        specializations: ['Women\'s Health', 'Ayurvedic Nutrition'],
        qualifications: [
          { degree: 'BAMS', institution: 'Banaras Hindu University', year: 2012 },
          { degree: 'MS (Ayurveda)', institution: 'AIIMS Delhi', year: 2015 }
        ],
        experience: 9,
        consultationModes: ['online', 'in-person'],
        consultationFee: {
          online: 600,
          inPerson: 900
        },
        languages: ['Hindi', 'English'],
        bio: 'Specialist in women\'s health and nutritional counseling through Ayurvedic principles.',
        rating: { average: 4.8, count: 42 },
        isVerified: true,
        isActive: true,
        totalConsultations: 200,
        availability: {
          schedule: [
            {
              day: 'monday',
              slots: [
                { startTime: '11:00', endTime: '11:30', mode: 'online' },
                { startTime: '11:30', endTime: '12:00', mode: 'online' },
                { startTime: '16:00', endTime: '16:30', mode: 'in-person' },
                { startTime: '16:30', endTime: '17:00', mode: 'in-person' }
              ]
            },
            {
              day: 'tuesday',
              slots: [
                { startTime: '10:00', endTime: '10:30', mode: 'online' },
                { startTime: '10:30', endTime: '11:00', mode: 'online' },
                { startTime: '15:00', endTime: '15:30', mode: 'in-person' }
              ]
            },
            {
              day: 'wednesday',
              slots: [
                { startTime: '11:00', endTime: '11:30', mode: 'online' },
                { startTime: '11:30', endTime: '12:00', mode: 'online' },
                { startTime: '16:00', endTime: '16:30', mode: 'in-person' },
                { startTime: '16:30', endTime: '17:00', mode: 'in-person' }
              ]
            },
            {
              day: 'thursday',
              slots: [
                { startTime: '09:00', endTime: '09:30', mode: 'online' },
                { startTime: '09:30', endTime: '10:00', mode: 'online' },
                { startTime: '14:00', endTime: '14:30', mode: 'in-person' },
                { startTime: '14:30', endTime: '15:00', mode: 'in-person' }
              ]
            },
            {
              day: 'friday',
              slots: [
                { startTime: '11:00', endTime: '11:30', mode: 'online' },
                { startTime: '16:00', endTime: '16:30', mode: 'in-person' }
              ]
            }
          ]
        }
      },
      {
        user: doctorUsers[2]._id,
        specializations: ['Digestive Health', 'Herbal Medicine'],
        qualifications: [
          { degree: 'BAMS', institution: 'Pune University', year: 2008 },
          { degree: 'PhD (Ayurveda)', institution: 'Mumbai University', year: 2012 }
        ],
        experience: 13,
        consultationModes: ['online', 'in-person'],
        consultationFee: {
          online: 700,
          inPerson: 1000
        },
        languages: ['Hindi', 'English', 'Marathi'],
        bio: 'Expert in digestive disorders and herbal medicine formulations.',
        rating: { average: 4.6, count: 38 },
        isVerified: true,
        isActive: true,
        totalConsultations: 180,
        availability: {
          schedule: [
            {
              day: 'monday',
              slots: [
                { startTime: '10:00', endTime: '10:30', mode: 'online' },
                { startTime: '10:30', endTime: '11:00', mode: 'online' },
                { startTime: '15:00', endTime: '15:30', mode: 'in-person' },
                { startTime: '15:30', endTime: '16:00', mode: 'in-person' }
              ]
            },
            {
              day: 'tuesday',
              slots: [
                { startTime: '09:00', endTime: '09:30', mode: 'online' },
                { startTime: '14:00', endTime: '14:30', mode: 'in-person' }
              ]
            },
            {
              day: 'wednesday',
              slots: [
                { startTime: '10:00', endTime: '10:30', mode: 'online' },
                { startTime: '15:00', endTime: '15:30', mode: 'in-person' }
              ]
            },
            {
              day: 'thursday',
              slots: [
                { startTime: '11:00', endTime: '11:30', mode: 'online' },
                { startTime: '16:00', endTime: '16:30', mode: 'in-person' }
              ]
            },
            {
              day: 'friday',
              slots: [
                { startTime: '10:00', endTime: '10:30', mode: 'online' },
                { startTime: '10:30', endTime: '11:00', mode: 'online' },
                { startTime: '15:00', endTime: '15:30', mode: 'in-person' },
                { startTime: '15:30', endTime: '16:00', mode: 'in-person' }
              ]
            },
            {
              day: 'saturday',
              slots: [
                { startTime: '09:00', endTime: '09:30', mode: 'online' },
                { startTime: '14:00', endTime: '14:30', mode: 'in-person' }
              ]
            }
          ]
        }
      },
      {
        user: doctorUsers[3]._id,
        specializations: ['Mental Wellness', 'Yoga Therapy'],
        qualifications: [
          { degree: 'BAMS', institution: 'Kerala University', year: 2011 },
          { degree: 'Yoga Therapy Certification', institution: 'Yoga Alliance', year: 2014 }
        ],
        experience: 10,
        consultationModes: ['online'],
        consultationFee: {
          online: 450
        },
        languages: ['Hindi', 'English', 'Malayalam'],
        bio: 'Combining Ayurveda with yoga therapy for mental wellness and stress management.',
        rating: { average: 4.7, count: 31 },
        isVerified: true,
        isActive: true,
        totalConsultations: 120,
        availability: {
          schedule: [
            {
              day: 'monday',
              slots: [
                { startTime: '08:00', endTime: '08:30', mode: 'online' },
                { startTime: '08:30', endTime: '09:00', mode: 'online' },
                { startTime: '18:00', endTime: '18:30', mode: 'online' }
              ]
            },
            {
              day: 'tuesday',
              slots: [
                { startTime: '07:30', endTime: '08:00', mode: 'online' },
                { startTime: '18:30', endTime: '19:00', mode: 'online' }
              ]
            },
            {
              day: 'wednesday',
              slots: [
                { startTime: '08:00', endTime: '08:30', mode: 'online' },
                { startTime: '19:00', endTime: '19:30', mode: 'online' }
              ]
            },
            {
              day: 'thursday',
              slots: [
                { startTime: '07:00', endTime: '07:30', mode: 'online' },
                { startTime: '18:00', endTime: '18:30', mode: 'online' }
              ]
            },
            {
              day: 'friday',
              slots: [
                { startTime: '08:00', endTime: '08:30', mode: 'online' },
                { startTime: '18:30', endTime: '19:00', mode: 'online' }
              ]
            },
            {
              day: 'saturday',
              slots: [
                { startTime: '08:00', endTime: '08:30', mode: 'online' },
                { startTime: '08:30', endTime: '09:00', mode: 'online' },
                { startTime: '18:00', endTime: '18:30', mode: 'online' },
                { startTime: '18:30', endTime: '19:00', mode: 'online' }
              ]
            },
            {
              day: 'sunday',
              slots: [
                { startTime: '09:00', endTime: '09:30', mode: 'online' },
                { startTime: '19:00', endTime: '19:30', mode: 'online' }
              ]
            }
          ]
        }
      }
    ]);

    console.log('Creating sample appointments...');
    
    // Create sample appointments
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    await Appointment.create([
      {
        patient: patients[0]._id,
        doctor: doctors[0]._id,
        appointmentDate: tomorrow,
        timeSlot: { startTime: '09:00', endTime: '09:30' },
        consultationMode: 'online',
        status: 'confirmed',
        consultationFee: 500,
        paymentStatus: 'paid',
        symptoms: 'Feeling tired and low energy',
        notes: {
          patient: 'Looking for natural energy boosters'
        }
      },
      {
        patient: patients[1]._id,
        doctor: doctors[1]._id,
        appointmentDate: nextWeek,
        timeSlot: { startTime: '11:00', endTime: '11:30' },
        consultationMode: 'online',
        status: 'confirmed',
        consultationFee: 600,
        paymentStatus: 'paid',
        symptoms: 'Irregular menstrual cycle',
        notes: {
          patient: 'Seeking natural treatment options'
        }
      }
    ]);

    console.log('Database seeded successfully!');
    console.log(`Created ${patients.length} patients`);
    console.log(`Created ${doctors.length} doctors`);
    console.log('Sample appointments created');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
