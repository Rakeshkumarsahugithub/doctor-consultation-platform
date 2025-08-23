# Amrutam Doctor Consultation Platform

A modern Ayurvedic doctor consultation platform built with Next.js frontend and Node.js backend, featuring real-time appointment booking, doctor discovery, and comprehensive user management.
**[▶️ View Video Demo](https://drive.google.com/file/d/1TIUfCwLyi69oeW5ARHs9g1-fpcdi4jfj/view?usp=drive_link)** and 
**[🌐 For Live Demo Click Me](https://doctor-consultation-platform-iv8g.vercel.app)**

## 🚀 Technologies Used

### Backend Technologies
| Technology | Purpose | Implementation |
|------------|---------|----------------|
| **Express.js** | Web framework | RESTful API server with middleware support |
| **MongoDB** | Database | Document-based storage for users, doctors, appointments |
| **Mongoose** | ODM | Schema validation, relationships, and query optimization |
| **JWT** | Authentication | Stateless token-based auth with role management |
| **bcryptjs** | Password Security | Password hashing and verification |
| **Helmet** | Security Headers | XSS protection, content security policy, HSTS |
| **Morgan** | HTTP Logging | Request/response logging for debugging and monitoring |
| **express-rate-limit** | Rate Limiting | API abuse prevention (100 requests/15min) |
| **CORS** | Cross-Origin | Secure cross-origin resource sharing |
| **Joi** | Input Validation | Schema-based request validation and sanitization |
| **Swagger** | API Documentation | Interactive API documentation with swagger-ui-express |
| **node-cron** | Task Scheduling | Automated cleanup of expired appointment slots |

### Frontend Technologies
| Technology | Purpose | Implementation |
|------------|---------|----------------|
| **Next.js 13** | React Framework | SSR, SSG, API routes, and file-based routing |
| **TypeScript** | Type Safety | Static typing for better development experience |
| **Tailwind CSS** | Styling | Utility-first CSS framework with responsive design |
| **React Query** | State Management | Server state caching, synchronization, and updates |
| **Axios** | HTTP Client | Promise-based HTTP requests with interceptors |
| **React Hook Form** | Form Management | Performant forms with validation |
| **React Hot Toast** | Notifications | User-friendly toast notifications |
| **Headless UI** | UI Components | Accessible, unstyled UI components |
| **Heroicons** | Icons | Beautiful hand-crafted SVG icons |
| **date-fns** | Date Utilities | Modern JavaScript date utility library |
| **jwt-decode** | Token Parsing | Client-side JWT token decoding |

## 📁 Project Structure

```
docto/
├── backend/                    # Node.js Backend Server
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   │   ├── database.js    # MongoDB connection & indexes
│   │   │   └── swagger.js     # API documentation setup
│   │   ├── controllers/       # Business logic handlers
│   │   │   ├── auth.controller.js           # Authentication & authorization
│   │   │   ├── user.controller.js           # User profile management
│   │   │   ├── doctor.controller.js         # Doctor discovery & profiles
│   │   │   ├── appointment.controller.js    # Appointment booking & management
│   │   │   ├── slot.controller.js           # Time slot availability
│   │   │   └── doctor-dashboard.controller.js # Doctor dashboard analytics
│   │   ├── middleware/        # Custom middleware
│   │   │   ├── auth.js        # JWT verification & role checking
│   │   │   └── validation.js  # Request validation schemas
│   │   ├── models/           # MongoDB schemas
│   │   │   ├── User.js       # User accounts (patients & doctors)
│   │   │   ├── Doctor.js     # Doctor profiles & availability
│   │   │   ├── Appointment.js # Appointment bookings
│   │   │   └── Slot.js       # Time slot management
│   │   ├── routes/           # API route definitions
│   │   │   ├── auth.routes.js      # Authentication endpoints
│   │   │   ├── user.routes.js      # User management endpoints
│   │   │   ├── doctor.routes.js    # Doctor discovery endpoints
│   │   │   ├── appointment.routes.js # Appointment management endpoints
│   │   │   ├── slot.routes.js      # Slot availability endpoints
│   │   │   └── doctor-dashboard.routes.js # Doctor dashboard endpoints
│   │   ├── scripts/          # Database utilities
│   │   │   ├── seedDatabase.js     # Sample data seeding
│   │   │   └── updateDoctorNames.js # Data migration scripts
│   │   └── index.js          # Express server setup & middleware
│   ├── .env                  # Environment variables
│   ├── .env.example         # Environment template
│   ├── package.json         # Backend dependencies
│   └── start-server.bat     # Windows server startup script
├── frontend/                 # Next.js Frontend Application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Layout.tsx    # Main layout wrapper
│   │   │   ├── DoctorCard.tsx # Doctor profile cards
│   │   │   └── Pagination.tsx # Pagination component
│   │   ├── context/          # React context providers
│   │   │   └── AuthContext.tsx # Authentication state management
│   │   ├── pages/            # Next.js pages (file-based routing)
│   │   │   ├── _app.tsx      # App wrapper with providers
│   │   │   ├── _document.tsx # HTML document structure
│   │   │   ├── index.tsx     # Homepage
│   │   │   ├── login.tsx     # User login page
│   │   │   ├── register.tsx  # User registration page
│   │   │   ├── doctors/      # Doctor-related pages
│   │   │   │   ├── index.tsx # Doctor discovery page
│   │   │   │   └── [id].tsx  # Individual doctor profile
│   │   │   ├── appointments/ # Appointment pages
│   │   │   │   ├── index.tsx # User appointments list
│   │   │   │   └── book.tsx  # Appointment booking form
│   │   │   ├── profile/      # User profile pages
│   │   │   │   ├── index.tsx # User profile view/edit
│   │   │   │   └── doctor.tsx # Doctor profile setup
│   │   │   └── dashboard/    # Doctor dashboard
│   │   │       └── index.tsx # Doctor appointments & analytics
│   │   └── styles/           # Styling files
│   │       ├── globals.css   # Global styles & Tailwind imports
│   │       └── output.css    # Compiled Tailwind CSS
│   ├── .env                  # Frontend environment variables
│   ├── next.config.js        # Next.js configuration
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   ├── postcss.config.js     # PostCSS configuration
│   ├── tsconfig.json         # TypeScript configuration
│   └── package.json          # Frontend dependencies
├── .gitignore               # Git ignore patterns
├── README.md                # Project documentation
└── SCALING.md               # Architecture scaling guide
```

## 🏗️ Architecture & How It Works

### Frontend Architecture (Next.js)
- **Rendering Strategy**: Hybrid approach using SSR for SEO-critical pages and CSR for dynamic content
- **Routing**: File-based routing with dynamic routes for doctors and appointments
- **State Management**: React Query for server state, Context API for authentication
- **Styling**: Tailwind CSS with responsive design and dark mode support
- **API Integration**: Axios with interceptors for token management and error handling

### Backend Architecture (Node.js + Express)
- **API Design**: RESTful APIs with consistent response formats
- **Authentication**: JWT-based stateless authentication with role-based access control
- **Database**: MongoDB with Mongoose ODM for schema validation and relationships
- **Security**: Multi-layered security with Helmet, CORS, rate limiting, and input validation
- **Error Handling**: Centralized error handling with detailed logging
- **Documentation**: Auto-generated Swagger documentation

### Data Flow
1. **User Authentication**: JWT tokens stored in localStorage, validated on each request
2. **Doctor Discovery**: Real-time search with filters, pagination, and sorting
3. **Appointment Booking**: 5-minute slot locking mechanism to prevent double booking
4. **Real-time Updates**: Optimistic updates with React Query cache invalidation

## 🔧 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Rakeshkumarsahugithub/doctor-consultation-platform.git
cd doctor-consultation-platform
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env
# Update .env with your MongoDB URI and JWT secret
```

3. **Frontend Setup**
```bash
cd frontend
npm install
cp  .env
# Update .env with backend API URL
```

4. **Database Setup**
```bash
cd backend
node src/scripts/seedDatabase.js
```

5. **Start Development Servers**
```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
cd frontend
npm run dev
```

### Application URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/health

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Doctor Endpoints
- `GET /api/doctors` - Search doctors with filters
- `GET /api/doctors/:id` - Get doctor details
- `GET /api/doctors/:id/availability` - Get doctor availability

### Appointment Endpoints
- `POST /api/appointments` - Book appointment
- `GET /api/appointments` - Get user appointments
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### User Management
- `POST /api/users/doctor-profile` - Create/update doctor profile
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

## 🔐 Security Features

- **Helmet**: Security headers (XSS, CSRF, clickjacking protection)
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for specific origins
- **Input Validation**: Joi schema validation for all inputs
- **Password Security**: bcrypt hashing with salt rounds
- **JWT Security**: Secure token generation and validation
- **MongoDB Security**: Schema validation and sanitization

## 🚀 Performance Features

- **Database Indexing**: Optimized queries with proper indexes
- **Caching**: React Query for client-side caching
- **Pagination**: Efficient data loading with pagination
- **Lazy Loading**: Code splitting with Next.js dynamic imports
- **Image Optimization**: Next.js Image component with optimization
- **Bundle Optimization**: Tree shaking and code splitting

## 📱 Responsive Design

- **Mobile-First**: Tailwind CSS mobile-first approach
- **Breakpoints**: Responsive design for all screen sizes
- **Touch-Friendly**: Optimized for touch interactions
- **Progressive Enhancement**: Works without JavaScript

Full API documentation with examples is available at `/api-docs` when the server is running.#
