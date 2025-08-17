const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Doctor = require('../src/models/Doctor');
require('dotenv').config();

const addSampleDoctor = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Clear existing sample doctors to avoid duplicate key errors
    const existingEmails = [
      'meera.sood@example.com',
      'rajesh.kumar@example.com',
      'pawan.singh@example.com',
      'kamlesh.gupta@example.com',
      'rakesh.sahu@example.com'
    ];
    
    // Delete existing users with these emails
    for (const email of existingEmails) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        // Delete associated doctor
        await Doctor.deleteOne({ user: existingUser._id });
        // Delete user
        await User.deleteOne({ _id: existingUser._id });
        console.log(`Removed existing doctor with email: ${email}`);
      }
    }
    
    // Create a sample user for the doctor
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const user = new User({
    name: 'Dr. Meera Sood',
    email: 'meera.sood@example.com',
    password: hashedPassword,
    role: 'doctor',
    phone: '9876543210'
  });
    
    await user.save();
    console.log('Sample user created:', user.name);
    
    // Create the doctor profile
    const doctor = new Doctor({
      user: user._id,
      name: 'Dr. Meera Sood', // Store name directly in doctor document
      profileImage: 'https://i.pinimg.com/736x/c5/a3/90/c5a3904b38eb241dd03dd30889599dc4.jpg',
      specializations: ['Women\'s Health', 'Panchakarma'],
      qualifications: [
        {
          degree: 'BAMS',
          institution: 'Gujarat Ayurved University',
          year: 2015
        },
        {
          degree: 'MD (Ayurveda)',
          institution: 'Rajiv Gandhi University',
          year: 2018
        }
      ],
      experience: 8,
      consultationModes: ['online', 'in-person'],
      consultationFee: {
        online: 600,
        inPerson: 900
      },
      languages: ['English', 'Hindi', 'Gujarati'],
      clinicDetails: {
        name: 'Ayurvedic Wellness Center',
        address: {
          street: '123 Health Street',
          city: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380001',
          country: 'India'
        },
        phone: '9876543210'
      },
      availability: {
        timezone: 'Asia/Kolkata',
        schedule: [
          {
            day: 'monday',
            slots: [
              { startTime: '09:00', endTime: '09:30', mode: 'online' },
              { startTime: '09:30', endTime: '10:00', mode: 'online' },
              { startTime: '10:00', endTime: '10:30', mode: 'online' },
              { startTime: '10:30', endTime: '11:00', mode: 'online' },
              { startTime: '11:00', endTime: '11:30', mode: 'online' },
              { startTime: '11:30', endTime: '12:00', mode: 'online' },
              { startTime: '14:00', endTime: '14:30', mode: 'in-person' },
              { startTime: '14:30', endTime: '15:00', mode: 'in-person' },
              { startTime: '15:00', endTime: '15:30', mode: 'in-person' },
              { startTime: '15:30', endTime: '16:00', mode: 'in-person' },
              { startTime: '16:00', endTime: '16:30', mode: 'in-person' },
              { startTime: '16:30', endTime: '17:00', mode: 'in-person' }
            ]
          },
          {
            day: 'tuesday',
            slots: [
              { startTime: '09:00', endTime: '09:30', mode: 'online' },
              { startTime: '09:30', endTime: '10:00', mode: 'online' },
              { startTime: '10:00', endTime: '10:30', mode: 'online' },
              { startTime: '10:30', endTime: '11:00', mode: 'online' },
              { startTime: '11:00', endTime: '11:30', mode: 'online' },
              { startTime: '11:30', endTime: '12:00', mode: 'online' },
              { startTime: '14:00', endTime: '14:30', mode: 'in-person' },
              { startTime: '14:30', endTime: '15:00', mode: 'in-person' },
              { startTime: '15:00', endTime: '15:30', mode: 'in-person' },
              { startTime: '15:30', endTime: '16:00', mode: 'in-person' }
            ]
          },
          {
            day: 'wednesday',
            slots: [
              { startTime: '09:00', endTime: '09:30', mode: 'online' },
              { startTime: '09:30', endTime: '10:00', mode: 'online' },
              { startTime: '10:00', endTime: '10:30', mode: 'online' },
              { startTime: '10:30', endTime: '11:00', mode: 'online' },
              { startTime: '11:00', endTime: '11:30', mode: 'online' },
              { startTime: '11:30', endTime: '12:00', mode: 'online' },
              { startTime: '14:00', endTime: '14:30', mode: 'in-person' },
              { startTime: '14:30', endTime: '15:00', mode: 'in-person' },
              { startTime: '15:00', endTime: '15:30', mode: 'in-person' },
              { startTime: '15:30', endTime: '16:00', mode: 'in-person' }
            ]
          },
          {
            day: 'thursday',
            slots: [
              { startTime: '09:00', endTime: '09:30', mode: 'online' },
              { startTime: '09:30', endTime: '10:00', mode: 'online' },
              { startTime: '10:00', endTime: '10:30', mode: 'online' },
              { startTime: '10:30', endTime: '11:00', mode: 'online' },
              { startTime: '11:00', endTime: '11:30', mode: 'online' },
              { startTime: '11:30', endTime: '12:00', mode: 'online' },
              { startTime: '14:00', endTime: '14:30', mode: 'in-person' },
              { startTime: '14:30', endTime: '15:00', mode: 'in-person' },
              { startTime: '15:00', endTime: '15:30', mode: 'in-person' },
              { startTime: '15:30', endTime: '16:00', mode: 'in-person' },
              { startTime: '16:00', endTime: '16:30', mode: 'in-person' }
            ]
          },
          {
            day: 'friday',
            slots: [
              { startTime: '09:00', endTime: '09:30', mode: 'online' },
              { startTime: '09:30', endTime: '10:00', mode: 'online' },
              { startTime: '10:00', endTime: '10:30', mode: 'online' },
              { startTime: '10:30', endTime: '11:00', mode: 'online' },
              { startTime: '11:00', endTime: '11:30', mode: 'online' },
              { startTime: '11:30', endTime: '12:00', mode: 'online' },
              { startTime: '14:00', endTime: '14:30', mode: 'in-person' },
              { startTime: '14:30', endTime: '15:00', mode: 'in-person' },
              { startTime: '15:00', endTime: '15:30', mode: 'in-person' },
              { startTime: '15:30', endTime: '16:00', mode: 'in-person' }
            ]
          },
          {
            day: 'saturday',
            slots: [
              { startTime: '09:00', endTime: '09:30', mode: 'online' },
              { startTime: '09:30', endTime: '10:00', mode: 'online' },
              { startTime: '10:00', endTime: '10:30', mode: 'online' },
              { startTime: '10:30', endTime: '11:00', mode: 'online' },
              { startTime: '11:00', endTime: '11:30', mode: 'online' },
              { startTime: '11:30', endTime: '12:00', mode: 'online' }
            ]
          }
          // Sunday is skipped intentionally as requested
        ]
      },
      rating: {
        average: 4.8,
        count: 42
      },
      bio: 'Specialist in women\'s health and nutritional counseling through Ayurvedic principles.',
      isVerified: true,
      isActive: true,
      totalConsultations: 156
    });
    
    await doctor.save();
    console.log('Sample doctor created:', doctor.name);
    
    // Create another sample doctor
    const user2 = new User({
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@example.com',
    password: hashedPassword,
    role: 'doctor',
    phone: '9876543211'
  });
    
    await user2.save();
    
    const doctor2 = new Doctor({
      user: user2._id,
      name: 'Dr. Rajesh Kumar',
      specializations: ['Digestive Health', 'Herbal Medicine'],
      qualifications: [
        {
          degree: 'BAMS',
          institution: 'Pune University',
          year: 2008
        },
        {
          degree: 'PhD (Ayurveda)',
          institution: 'Mumbai University',
          year: 2012
        }
      ],
      experience: 13,
      consultationModes: ['online', 'in-person'],
      consultationFee: {
        online: 700,
        inPerson: 1000
      },
      languages: ['Hindi', 'English', 'Marathi'],
      availability: {
        timezone: 'Asia/Kolkata',
        schedule: [
          {
            day: 'monday',
            slots: [
              { startTime: '10:00', endTime: '10:30', mode: 'online' },
              { startTime: '15:00', endTime: '15:30', mode: 'in-person' }
            ]
          },
          {
            day: 'tuesday',
            slots: [
              { startTime: '09:00', endTime: '09:30', mode: 'online' },
              { startTime: '14:00', endTime: '14:30', mode: 'in-person' }
            ]
          }
        ]
      },
      rating: {
        average: 4.6,
        count: 38
      },
      bio: 'Expert in digestive disorders and herbal medicine formulations.',
      isVerified: true,
      isActive: true,
      totalConsultations: 180
    });
    
    await doctor2.save();
    console.log('Second sample doctor created:', doctor2.name);
    
    // Create third sample doctor - Dr. Pawan Singh
    const user3 = new User({
      name: 'Dr. Pawan Singh',
      email: 'pawan.singh@example.com',
      password: hashedPassword,
      role: 'doctor',
      phone: '9876543212'
    });
    
    await user3.save();
    
    const doctor3 = new Doctor({
      user: user3._id,
      name: 'Dr. Pawan Singh',
      specializations: ['Skin & Hair Care'],
      profileImage: 'https://www.kyd.co.in/static/media/home-doctor.98d6c2d2e5325531b0fc.webp',
      qualifications: [
        {
          degree: 'BAMS',
          institution: 'Delhi University',
          year: 2010
        },
        {
          degree: 'MD (Ayurveda)',
          institution: 'Banaras Hindu University',
          year: 2014
        }
      ],
      experience: 10,
      consultationModes: ['online', 'in-person'],
      consultationFee: {
        online: 650,
        inPerson: 950
      },
      languages: ['Hindi', 'English', 'Punjabi'],
      availability: {
        timezone: 'Asia/Kolkata',
        schedule: [
          {
            day: 'monday',
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
            day: 'friday',
            slots: [
              { startTime: '11:00', endTime: '11:30', mode: 'online' },
              { startTime: '16:00', endTime: '16:30', mode: 'in-person' }
            ]
          }
        ]
      },
      rating: {
        average: 4.7,
        count: 35
      },
      bio: 'Specialist in Ayurvedic treatments for skin and hair conditions.',
      isVerified: true,
      isActive: true,
      totalConsultations: 145
    });
    
    await doctor3.save();
    console.log('Third sample doctor created:', doctor3.name);
    
    // Create fourth sample doctor - Dr. Kamlesh Gupta
    const user4 = new User({
      name: 'Dr. Kamlesh Gupta',
      email: 'kamlesh.gupta@example.com',
      password: hashedPassword,
      role: 'doctor',
      phone: '9876543213'
    });
    
    await user4.save();
    
    const doctor4 = new Doctor({
      user: user4._id,
      name: 'Dr. Kamlesh Gupta',
      specializations: ['Mental Wellness'],
      profileImage: 'https://media.istockphoto.com/id/177373093/photo/indian-male-doctor.jpg?s=612x612&w=0&k=20&c=5FkfKdCYERkAg65cQtdqeO_D0JMv6vrEdPw3mX1Lkfg=',
      qualifications: [
        {
          degree: 'BAMS',
          institution: 'Mumbai University',
          year: 2009
        },
        {
          degree: 'MD (Ayurveda)',
          institution: 'Gujarat Ayurved University',
          year: 2013
        }
      ],
      experience: 12,
      consultationModes: ['online', 'in-person'],
      consultationFee: {
        online: 700,
        inPerson: 1000
      },
      languages: ['Hindi', 'English', 'Gujarati'],
      availability: {
        timezone: 'Asia/Kolkata',
        schedule: [
          {
            day: 'tuesday',
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
            day: 'saturday',
            slots: [
              { startTime: '09:00', endTime: '09:30', mode: 'online' },
              { startTime: '14:00', endTime: '14:30', mode: 'in-person' }
            ]
          }
        ]
      },
      rating: {
        average: 4.9,
        count: 40
      },
      bio: 'Expert in Ayurvedic approaches to mental wellness and stress management.',
      isVerified: true,
      isActive: true,
      totalConsultations: 165
    });
    
    await doctor4.save();
    console.log('Fourth sample doctor created:', doctor4.name);
    
    // Create fifth sample doctor - Dr. Rakesh Kumar Sahu
    const user5 = new User({
      name: 'Dr. Rakesh Kumar Sahu',
      email: 'rakesh.sahu@example.com',
      password: hashedPassword,
      role: 'doctor',
      phone: '9876543214'
    });
    
    await user5.save();
    
    const doctor5 = new Doctor({
      user: user5._id,
      name: 'Dr. Rakesh Kumar Sahu',
      specializations: ['Joint & Bone Care', 'Yoga Therapy'],
      profileImage: 'https://t4.ftcdn.net/jpg/07/07/89/33/360_F_707893394_5DEhlBjWOmse1nyu0rC9T7ZRvsAFDkYC.jpg',
      qualifications: [
        {
          degree: 'BAMS',
          institution: 'Rajasthan University',
          year: 2007
        },
        {
          degree: 'MD (Ayurveda)',
          institution: 'Jaipur National University',
          year: 2011
        },
        {
          degree: 'Yoga Certification',
          institution: 'Yoga Alliance',
          year: 2013
        }
      ],
      experience: 15,
      consultationModes: ['online', 'in-person'],
      consultationFee: {
        online: 750,
        inPerson: 1100
      },
      languages: ['Hindi', 'English', 'Sanskrit'],
      availability: {
        timezone: 'Asia/Kolkata',
        schedule: [
          {
            day: 'monday',
            slots: [
              { startTime: '08:00', endTime: '08:30', mode: 'online' },
              { startTime: '17:00', endTime: '17:30', mode: 'in-person' }
            ]
          },
          {
            day: 'wednesday',
            slots: [
              { startTime: '09:00', endTime: '09:30', mode: 'online' },
              { startTime: '16:00', endTime: '16:30', mode: 'in-person' }
            ]
          },
          {
            day: 'friday',
            slots: [
              { startTime: '10:00', endTime: '10:30', mode: 'online' },
              { startTime: '15:00', endTime: '15:30', mode: 'in-person' }
            ]
          }
        ]
      },
      rating: {
        average: 4.8,
        count: 45
      },
      bio: 'Specialized in joint and bone care through Ayurvedic treatments and therapeutic yoga practices.',
      isVerified: true,
      isActive: true,
      totalConsultations: 190
    });
    
    await doctor5.save();
    console.log('Fifth sample doctor created:', doctor5.name);
    
    console.log('Sample doctors added successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error adding sample doctors:', error);
    process.exit(1);
  }
};

addSampleDoctor();
