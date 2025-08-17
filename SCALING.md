# Scaling Architecture for 5,000 Appointments/Day

## Executive Summary

To scale the Amrutam Doctor Consultation Platform to handle **5,000 appointments per day across 1,000 doctors**, we need a comprehensive architectural transformation focusing on database optimization, microservices architecture, real-time capabilities, and intelligent caching strategies.

## API Documentation

The platform now includes comprehensive Swagger API documentation available at `/api-docs` endpoint. This documentation covers:

- **Authentication APIs**: Registration, login, profile management
- **Doctor Management APIs**: Profile creation, availability management, search
- **Appointment APIs**: Booking, cancellation, rescheduling, history
- **Real-time APIs**: WebSocket endpoints for live availability updates

### API Design Principles

1. **RESTful Design**: Following REST conventions with proper HTTP methods and status codes
2. **Consistent Response Format**: Standardized success/error response structures
3. **Comprehensive Error Handling**: Detailed error messages with appropriate HTTP status codes
4. **Security First**: JWT-based authentication with role-based access control
5. **Rate Limiting**: Built-in protection against abuse and DDoS attacks

## Current Architecture Analysis

### Current Setup
- **Frontend**: Next.js with TypeScript, Tailwind CSS, React Query
- **Backend**: Node.js with Express, MongoDB, JWT authentication  
- **Database**: Single MongoDB instance
- **Caching**: Redis implementation with slot locking
- **Real-time**: WebSocket support for availability updates

### Proposed Scaled Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Load Balancer  │────▶│  API Gateway   │────▶│  Auth Service   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                              │
         │                                              │
         ▼                                              ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Web Servers    │────▶│  Microservices  │────▶│  Databases      │
│  (Next.js)      │     │  (Node.js)      │     │  (PostgreSQL)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │                        │
                                │                        │
                                ▼                        ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │                 │     │                 │
                        │  Cache Layer    │     │  Analytics &    │
                        │  (Redis)        │     │  Monitoring     │
                        └─────────────────┘     └─────────────────┘
```

## Database Architecture & Scaling Strategy

### Current Database Design
The platform uses MongoDB with the following collections:
- **Users**: Patient and doctor profiles with role-based access
- **Doctors**: Extended doctor profiles with specializations, availability, and ratings
- **Appointments**: Booking records with status tracking and history
- **Slots**: Time slot management with locking mechanisms

### Database Scaling Approaches

#### 1. MongoDB Scaling Strategy
- **Replica Sets**: 3-node replica set for high availability
- **Sharding**: Horizontal scaling based on user ID or geographical regions
- **Indexes**: Optimized compound indexes for common queries
  ```javascript
  // Appointment queries
  db.appointments.createIndex({ "doctor": 1, "appointmentDate": 1, "status": 1 })
  db.appointments.createIndex({ "patient": 1, "appointmentDate": -1 })
  
  // Doctor search
  db.doctors.createIndex({ "specializations": 1, "rating.average": -1 })
  db.doctors.createIndex({ "consultationModes": 1, "availability.schedule.day": 1 })
  ```

#### 2. Migration to PostgreSQL (Long-term)
For better ACID compliance and complex queries:
```sql
-- Appointments table with partitioning
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    appointment_date DATE NOT NULL,
    slot_start_time TIME NOT NULL,
    slot_end_time TIME NOT NULL,
    status appointment_status NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
) PARTITION BY RANGE (appointment_date);

-- Monthly partitions for better performance
CREATE TABLE appointments_2025_01 PARTITION OF appointments
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

#### 3. Caching Strategy
- **Redis Cluster**: Multi-node Redis setup for high availability
- **Cache Patterns**:
  ```javascript
  // Doctor availability caching
  const cacheKey = `doctor:${doctorId}:availability:${date}`;
  const ttl = 300; // 5 minutes
  
  // Slot locking for concurrent bookings
  const lockKey = `slot:${doctorId}:${date}:${timeSlot}`;
  const lockTtl = 300; // 5 minutes
  ```

#### 4. Database Performance Optimization
- **Connection Pooling**: MongoDB connection pool with 10-50 connections
- **Query Optimization**: Aggregation pipelines for complex queries
- **Data Archiving**: Move old appointments to archive collections

## API Optimization

### 1. API Gateway
- Implement rate limiting (per user, per IP)
- Request validation and sanitization
- Response compression
- JWT validation and token refresh
- Request routing to appropriate microservices

### 2. Microservices Architecture

#### Service Decomposition Strategy
```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Kong/AWS API Gateway)       │
│  - Rate Limiting  - Authentication  - Request Routing      │
└─────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │ Auth Service │ │Doctor Service│ │Booking Svc │
        │              │ │              │ │            │
        │- JWT tokens  │ │- Profiles    │ │- Slots     │
        │- User mgmt   │ │- Availability│ │- Bookings  │
        │- Roles       │ │- Search      │ │- Payments  │
        └──────────────┘ └──────────────┘ └────────────┘
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │Notification  │ │Analytics Svc │ │Search Svc  │
        │Service       │ │              │ │            │
        │- Email/SMS   │ │- Metrics     │ │- Elastic   │
        │- Push notifs │ │- Reports     │ │- Filters   │
        │- Templates   │ │- Dashboards  │ │- Geo search│
        └──────────────┘ └──────────────┘ └────────────┘
```

#### Individual Service Specifications

**Auth Service**
- **Technology**: Node.js + Express + MongoDB
- **Responsibilities**: User registration, authentication, JWT management
- **Database**: Users collection with role-based access
- **APIs**: `/register`, `/login`, `/refresh-token`, `/profile`
- **Scaling**: Stateless, horizontally scalable

**Doctor Service** 
- **Technology**: Node.js + Express + MongoDB
- **Responsibilities**: Doctor profiles, availability management, specializations
- **Database**: Doctors collection with embedded availability schedules
- **APIs**: `/doctors`, `/doctors/:id/availability`, `/doctors/search`
- **Scaling**: Read-heavy, implement caching and read replicas

**Booking Service**
- **Technology**: Node.js + Express + MongoDB + Redis
- **Responsibilities**: Appointment booking, slot management, cancellations
- **Database**: Appointments collection + Redis for slot locking
- **APIs**: `/appointments`, `/appointments/:id/cancel`, `/slots/available`
- **Scaling**: Write-heavy, requires distributed locking and queue management

**Notification Service**
- **Technology**: Node.js + Message Queue (RabbitMQ/SQS)
- **Responsibilities**: Email, SMS, push notifications, templates
- **Database**: Notification logs and templates
- **APIs**: Internal service APIs, webhook endpoints
- **Scaling**: Async processing with message queues

**Search Service**
- **Technology**: Node.js + Elasticsearch + Redis
- **Responsibilities**: Doctor discovery, filtering, geo-location search
- **Database**: Elasticsearch indexes synchronized with MongoDB
- **APIs**: `/search/doctors`, `/search/specializations`, `/search/nearby`
- **Scaling**: Search-optimized with caching and indexing strategies

### 3. Asynchronous Processing
- Use message queues (RabbitMQ/Kafka) for:
  - Appointment confirmations
  - Reminder notifications
  - Slot release after expiration
  - Analytics events
  - Email/SMS delivery

### 4. API Design Patterns
- Implement idempotent APIs for booking operations
- Use optimistic concurrency control for slot reservations
- Implement retry mechanisms with exponential backoff
- Design for graceful degradation during peak loads

## Frontend Optimization

### 1. Static Generation & CDN
- Pre-render static pages (doctor profiles, FAQs)
- Distribute through CDN
- Implement edge caching for dynamic but relatively stable content

### 2. Client-Side Optimization
- Implement virtualized lists for doctor discovery
- Progressive loading of appointment history
- Optimistic UI updates for booking flow
- Code splitting and lazy loading of components

### 3. Progressive Web App Features
- Implement service workers for offline capabilities
- Add caching strategies for assets and API responses
- Enable push notifications for appointment reminders

## Infrastructure Considerations

### 1. Containerization & Orchestration
- Docker containers for all services
- Kubernetes for orchestration and auto-scaling
- Implement horizontal pod autoscaling based on CPU/memory metrics

### 2. Geographic Distribution
- Deploy to multiple regions based on user concentration
- Implement geo-routing for reduced latency
- Consider multi-region database strategy for global scale

### 3. Monitoring & Alerting
- Implement comprehensive monitoring (Prometheus/Grafana)
- Set up alerts for system health and performance metrics
- Implement distributed tracing (Jaeger/Zipkin) for request flows
- Set up log aggregation (ELK stack) for troubleshooting

### 4. Security Considerations
- Implement WAF (Web Application Firewall) for API protection
- Regular security scanning and penetration testing
- Implement rate limiting to prevent abuse
- Data encryption at rest and in transit

## Capacity Planning

### Assumptions
- 5,000 appointments/day = ~208 appointments/hour (peak: ~500/hour)
- 1,000 doctors = ~5 appointments per doctor per day
- Average API calls per appointment lifecycle: ~20 calls
- Peak-to-average ratio: 3:1 (peak hours handling 3x average load)

### Resource Allocation
- **Web Servers**: Auto-scaling group (3-10 instances)
- **API Servers**: Auto-scaling group (5-15 instances)
- **Database**: 4-8 node cluster with read replicas
- **Cache**: Redis cluster with 3+ nodes
- **Message Queue**: RabbitMQ/Kafka cluster with 3+ nodes

## Phased Implementation

### Phase 1: Foundation (1-2 months)
- Implement database optimization (indexes, query optimization)
- Add Redis caching for doctor availability
- Set up monitoring and performance baselines
- Implement basic rate limiting and security measures

### Phase 2: Service Separation (2-3 months)
- Split monolith into core microservices
- Implement message queues for async operations
- Set up containerization and basic orchestration
- Implement API gateway

### Phase 3: Advanced Scaling (3-4 months)
- Implement database sharding
- Deploy multi-region infrastructure
- Implement advanced caching strategies
- Set up comprehensive monitoring and alerting

### Phase 4: Optimization & Refinement (Ongoing)
- Continuous performance monitoring and optimization
- Implement machine learning for demand prediction
- Optimize resource allocation based on usage patterns
- Explore serverless architectures for specific components

## Specific Workflow Optimizations

### 1. Doctor Discovery
- Implement Elasticsearch for advanced doctor search
- Pre-compute availability windows during off-peak hours
- Cache search results with appropriate invalidation strategies

### 2. Appointment Booking
- Use Redis for distributed locking of slots
- Implement optimistic concurrency control
- Design idempotent booking APIs to prevent double-bookings
- Implement a queue for handling booking requests during peak periods

### 3. Notification System
- Use a dedicated notification service
- Implement message queues for reliable delivery
- Support multiple channels (email, SMS, push notifications)
- Implement retry mechanisms for failed notifications

## Conclusion
This scaling strategy provides a roadmap for evolving the platform from MVP to a system capable of handling 5,000+ daily appointments. The approach prioritizes reliability, performance, and maintainability while allowing for incremental implementation. By following this phased approach, Amrutam can scale its platform efficiently while maintaining a high-quality user experience for both patients and doctors.