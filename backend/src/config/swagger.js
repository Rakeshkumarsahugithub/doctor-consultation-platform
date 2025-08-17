const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Amrutam Doctor Booking API',
      version: '1.0.0',
      description: 'A comprehensive API for doctor appointment booking system with Ayurvedic healthcare focus',
      contact: {
        name: 'Amrutam API Support',
        email: 'support@amrutam.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.amrutam.com' 
          : 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login endpoint'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            _id: {
              type: 'string',
              description: 'User unique identifier'
            },
            name: {
              type: 'string',
              description: 'User full name',
              example: 'Dr. Priya Sharma'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'priya.sharma@example.com'
            },
            phone: {
              type: 'string',
              description: 'User phone number',
              example: '+91-9876543210'
            },
            role: {
              type: 'string',
              enum: ['patient', 'doctor', 'admin'],
              description: 'User role in the system'
            },
            profileImage: {
              type: 'string',
              description: 'URL to user profile image'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Doctor: {
          type: 'object',
          required: ['user', 'specializations', 'experience'],
          properties: {
            _id: {
              type: 'string',
              description: 'Doctor unique identifier'
            },
            user: {
              $ref: '#/components/schemas/User'
            },
            specializations: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Doctor specializations',
              example: ['Ayurveda', 'Women\'s Health', 'Panchakarma']
            },
            experience: {
              type: 'number',
              description: 'Years of experience',
              example: 8
            },
            qualifications: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  degree: { type: 'string', example: 'BAMS' },
                  institution: { type: 'string', example: 'Gujarat Ayurved University' },
                  year: { type: 'number', example: 2015 }
                }
              }
            },
            bio: {
              type: 'string',
              description: 'Doctor biography',
              example: 'Specialist in women\'s health and nutritional counseling through Ayurvedic principles.'
            },
            consultationFee: {
              type: 'object',
              properties: {
                online: { type: 'number', example: 600 },
                inPerson: { type: 'number', example: 900 }
              }
            },
            rating: {
              type: 'object',
              properties: {
                average: { type: 'number', example: 4.8 },
                count: { type: 'number', example: 42 }
              }
            },
            consultationModes: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['online', 'inPerson']
              }
            },
            languages: {
              type: 'array',
              items: { type: 'string' },
              example: ['English', 'Hindi', 'Gujarati']
            },
            availability: {
              type: 'object',
              properties: {
                schedule: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      day: { type: 'string', example: 'monday' },
                      slots: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            startTime: { type: 'string', example: '11:00' },
                            endTime: { type: 'string', example: '11:30' },
                            mode: { type: 'string', enum: ['online', 'inPerson'] }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        Appointment: {
          type: 'object',
          required: ['patient', 'doctor', 'appointmentDate', 'slot'],
          properties: {
            _id: {
              type: 'string',
              description: 'Appointment unique identifier'
            },
            patient: {
              type: 'string',
              description: 'Patient ID reference'
            },
            doctor: {
              type: 'string',
              description: 'Doctor ID reference'
            },
            appointmentDate: {
              type: 'string',
              format: 'date',
              description: 'Appointment date',
              example: '2025-08-20'
            },
            slot: {
              type: 'object',
              properties: {
                startTime: { type: 'string', example: '11:00' },
                endTime: { type: 'string', example: '11:30' },
                mode: { type: 'string', enum: ['online', 'inPerson'] },
                fee: { type: 'number', example: 600 }
              }
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'],
              description: 'Appointment status'
            },
            reason: {
              type: 'string',
              description: 'Appointment reason or notes'
            },
            cancelReason: {
              type: 'string',
              description: 'Cancellation reason if applicable'
            },
            rescheduleHistory: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  previousDate: { type: 'string', format: 'date' },
                  previousSlot: { type: 'object' },
                  rescheduleDate: { type: 'string', format: 'date-time' },
                  reason: { type: 'string' }
                }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              description: 'Error type'
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            details: {
              type: 'object',
              description: 'Additional error details'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            message: {
              type: 'string',
              description: 'Success message'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/models/*.js'
  ]
};

const specs = swaggerJSDoc(options);

module.exports = {
  specs,
  swaggerUi,
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Amrutam API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true
    }
  })
};
