# 🔔 Stage 4 Notification System

A distributed microservices-based notification system designed for HNG Stage 4, enabling scalable email and push notification delivery with template management, user preferences, and multi-provider support.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Services](#services)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Local Development](#local-development)
- [API Documentation](#api-documentation)
- [Docker Deployment](#docker-deployment)
- [Configuration](#configuration)
- [Project Structure](#project-structure)

## 🎯 Overview

This notification system is built as a collection of independent microservices that work together to deliver notifications via email and push channels. The system supports:

- **Email Notifications**: SMTP-based email delivery with template support
- **Push Notifications**: Firebase Cloud Messaging (FCM) for mobile push notifications
- **Template Management**: Centralized template service for dynamic content rendering
- **User Management**: User profiles, preferences, and device token management
- **Message Queuing**: RabbitMQ for reliable, asynchronous job processing
- **Multi-Database Support**: MongoDB for user data, PostgreSQL for templates

## 🏗️ Architecture

The system follows a microservices architecture pattern with the following components:

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│  API Gateway │────▶│ User Service│
└─────────────┘     └──────────────┘     └─────────────┘
                                                  │
                                                  ▼
                          ┌──────────────────────────────────┐
                          │      RabbitMQ Message Queue      │
                          └──────────────────────────────────┘
                                  │              │
                      ┌───────────┘              └───────────┐
                      ▼                                        ▼
              ┌──────────────┐                        ┌──────────────┐
              │Email Service │                        │Push Service  │
              └──────────────┘                        └──────────────┘
                      │                                        │
                      └──────────────┬───────────────────────┘
                                     ▼
                          ┌──────────────┐
                          │Template      │
                          │Service       │
                          └──────────────┘
```

### Key Design Principles

- **Asynchronous Processing**: RabbitMQ queues handle notification jobs asynchronously
- **Service Independence**: Each service can be developed, deployed, and scaled independently
- **Template-Based Content**: Centralized template service for consistent messaging
- **User Preferences**: Respect user notification preferences and quiet hours
- **Dead Letter Queues**: Failed notifications are captured for retry and analysis
- **Health Monitoring**: Each service exposes health check endpoints

## 🔧 Services

### 1. User Service (Port 4001)
- **Technology**: Node.js, Express, MongoDB
- **Purpose**: User management, authentication, preferences, and device token management
- **Features**:
  - User registration and authentication (JWT)
  - User profile management
  - Notification preferences (email, push, quiet hours)
  - Device token registration and management
  - Push token validation and cleanup

### 2. Email Service (Port 4002)
- **Technology**: Node.js, Express, Nodemailer, RabbitMQ
- **Purpose**: Email notification delivery via SMTP
- **Features**:
  - Consumes email jobs from RabbitMQ
  - Template-based email rendering
  - SMTP provider integration (Nodemailer)
  - Webhook support for provider callbacks
  - Swagger API documentation
  - Dead letter queue support

### 3. Push Service (Port 4004)
- **Technology**: Node.js, Express, Firebase Admin SDK, RabbitMQ
- **Purpose**: Push notification delivery via Firebase Cloud Messaging
- **Features**:
  - Consumes push jobs from RabbitMQ
  - Firebase Cloud Messaging (FCM) integration
  - Template-based notification rendering
  - User preference enforcement (quiet hours)
  - Device token validation and cleanup
  - Swagger API documentation
  - Dead letter queue support

### 4. Template Service (Port 4003)
- **Technology**: Python, FastAPI, SQLAlchemy, PostgreSQL/SQLite
- **Purpose**: Template management and rendering
- **Features**:
  - CRUD operations for notification templates
  - Multi-language template support
  - Template versioning
  - Dynamic variable substitution
  - RESTful API with OpenAPI documentation

### 5. API Gateway (Future)
- **Technology**: TBD
- **Purpose**: Single entry point for all client requests
- **Features**: Routing, authentication, rate limiting, load balancing

## 💻 Tech Stack

### Backend Services
- **Node.js 18+**: Runtime for user, email, and push services
- **Express 5**: Web framework for Node.js services
- **Python 3.11+**: Runtime for template service
- **FastAPI**: Web framework for Python service

### Message Queue
- **RabbitMQ**: Message broker for asynchronous job processing
- **AMQP**: Protocol for reliable message delivery

### Databases
- **MongoDB 7.0**: NoSQL database for user data
- **PostgreSQL 16**: Relational database for templates (production)
- **SQLite**: Lightweight database for local template development

### Notification Providers
- **Nodemailer**: SMTP email delivery
- **Firebase Admin SDK**: Firebase Cloud Messaging for push notifications

### Additional Tools
- **Swagger/OpenAPI**: API documentation
- **Docker & Docker Compose**: Containerization and orchestration
- **JWT**: Authentication tokens
- **Celebrate/Joi**: Request validation
- **Helmet**: Security headers
- **Winston**: Structured logging

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** (Windows/Mac) or **Docker Engine + Docker Compose** (Linux)
- **Node.js 18+** (for local development)
- **Python 3.11+** (for template service local development)
- **Git**

### Option 1: Docker Compose (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd stage-4-notification-system
   ```

2. **Start all services:**
   ```bash
   # Windows (PowerShell)
   .\docker-start.ps1
   
   # Linux/Mac
   cd infra
   ./docker-start.sh
   
   # Or manually
   cd infra
   docker-compose up -d
   ```

3. **Verify services are running:**
   ```bash
   docker-compose ps
   ```

4. **Access the services:**
   - **RabbitMQ Management UI**: http://localhost:15672 (admin/admin123)
   - **User Service**: http://localhost:4001
   - **Email Service**: http://localhost:4002
   - **Email Swagger**: http://localhost:4002/docs
   - **Template Service**: http://localhost:4003
   - **Template Swagger**: http://localhost:4003/docs
   - **Push Service**: http://localhost:4004
   - **Push Swagger**: http://localhost:4004/docs

### Option 2: Local Development

See individual service READMEs for local setup instructions:
- [User Service](./Services/user-server/README.md)
- [Email Service](./Services/email-server/README.md)
- [Push Service](./Services/push-server/README.md)
- [Template Service](./Services/template-server/README.md)

## 🛠️ Local Development

### Setting Up Individual Services

1. **User Service:**
   ```bash
   cd Services/user-server
   npm install
   cp env.example .env
   # Configure .env file
   npm run dev
   ```

2. **Email Service:**
   ```bash
   cd Services/email-server
   npm install
   cp env.example .env
   # Configure .env file
   npm run dev
   ```

3. **Push Service:**
   ```bash
   cd Services/push-server
   npm install
   cp env.example .env
   # Configure .env file
   npm run dev
   ```

4. **Template Service:**
   ```bash
   cd Services/template-server
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   cp env.example .env
   # Configure .env file
   uvicorn src.main:app --reload --host 0.0.0.0 --port 4003
   ```

### Prerequisites for Local Development

- **RabbitMQ**: Running locally or via Docker
- **MongoDB**: Running locally or via Docker
- **PostgreSQL**: Running locally (optional, can use SQLite for development)

## 📚 API Documentation

### Swagger Documentation

- **Email Service**: http://localhost:4002/docs
- **Push Service**: http://localhost:4004/docs
- **Template Service**: http://localhost:4003/docs

### API Endpoints

#### User Service
- `POST /api/v1/users/register` - Register a new user
- `POST /api/v1/users/login` - User authentication
- `GET /api/v1/users/:id` - Get user profile
- `PUT /api/v1/users/:id` - Update user profile
- `POST /api/v1/users/:id/push-tokens` - Register push token
- `GET /health` - Health check

#### Email Service
- `POST /api/v1/email/test-send` - Send test email
- `POST /api/v1/email/webhook/:provider` - Provider webhook
- `GET /health` - Health check

#### Push Service
- `POST /api/v1/push/test-send` - Send test push notification
- `POST /api/v1/push/webhook/:provider` - Provider webhook
- `GET /health` - Health check

#### Template Service
- `POST /api/v1/templates/` - Create template
- `GET /api/v1/templates/` - List all templates
- `GET /api/v1/templates/:code` - Get template by code
- `PUT /api/v1/templates/:code` - Update template
- `DELETE /api/v1/templates/:code` - Delete template
- `GET /health` - Health check

## 🐳 Docker Deployment

### Docker Compose Setup

The project includes a comprehensive Docker Compose configuration in the `infra` directory. See [infra/README.md](./infra/README.md) for detailed instructions.

### Services Included

- **RabbitMQ**: Message queue (ports 5672, 15672)
- **MongoDB**: User database (port 27017)
- **PostgreSQL**: Template database (port 5432)
- **User Service**: Port 4001
- **Email Service**: Port 4002
- **Push Service**: Port 4004
- **Template Service**: Port 4003

### Environment Variables

Create a `.env` file in the `infra` directory with the following variables:

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=template_service
MONGODB_URI=mongodb://mongodb:27017/notification_system

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=no-reply@example.com

# Firebase
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
# OR
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/service-account.json
FIREBASE_PROJECT_ID=your-project-id

# CORS
CORS_ORIGIN=http://localhost:3000
```

## ⚙️ Configuration

### Environment Variables

Each service requires specific environment variables. See individual service READMEs for detailed configuration:

- [User Service Configuration](./Services/user-server/README.md#configuration)
- [Email Service Configuration](./Services/email-server/README.md#configuration)
- [Push Service Configuration](./Services/push-server/README.md#configuration)
- [Template Service Configuration](./Services/template-server/README.md#configuration)

### RabbitMQ Configuration

- **Exchange**: `notifications.direct`
- **Email Queue**: `email.queue`
- **Push Queue**: `push.queue`
- **Dead Letter Queue**: `failed.queue`

### Database Configuration

- **MongoDB**: Used by user-service for user data
- **PostgreSQL**: Used by template-service for templates (production)
- **SQLite**: Used by template-service for local development

## 📁 Project Structure

```
stage-4-notification-system/
├── Services/
│   ├── user-server/          # User management service
│   ├── email-server/         # Email notification service
│   ├── push-server/          # Push notification service
│   ├── template-server/      # Template management service
│   └── api-gateway/          # API gateway (future)
├── infra/
│   ├── docker-compose.yml    # Docker Compose configuration
│   ├── docker-start.ps1      # PowerShell startup script
│   ├── docker-start.sh       # Bash startup script
│   └── README.md             # Docker setup documentation
├── docker-start.ps1          # Root-level wrapper script
├── README.md                 # This file
└── .gitignore                # Git ignore rules
```

## 🔒 Security Considerations

- **JWT Authentication**: Secure token-based authentication
- **Environment Variables**: Sensitive data stored in environment variables
- **Helmet**: Security headers for HTTP responses
- **Input Validation**: Request validation using Celebrate/Joi
- **CORS**: Configurable CORS origins
- **Secret Management**: Use Docker secrets or environment variables in production

## 🧪 Testing

### Health Checks

All services expose health check endpoints:
- User Service: `GET http://localhost:4001/health`
- Email Service: `GET http://localhost:4002/health`
- Push Service: `GET http://localhost:4004/health`
- Template Service: `GET http://localhost:4003/health`

### Manual Testing

Use the Swagger documentation at `/docs` endpoints to test API endpoints interactively.

## 🚧 Future Enhancements

- [ ] API Gateway implementation
- [ ] Rate limiting and throttling
- [ ] Advanced template rendering engine
- [ ] Webhook support for all providers
- [ ] Metrics and monitoring (Prometheus, Grafana)
- [ ] Distributed tracing (Jaeger, Zipkin)
- [ ] Multi-provider support (SendGrid, AWS SES, etc.)
- [ ] Notification scheduling
- [ ] Analytics and reporting
- [ ] A/B testing for templates

## 📝 License

This project is part of the HNG Stage 4 program.

## 🤝 Contributing

This is a learning project for HNG Stage 4. For issues and improvements, please create an issue or submit a pull request.

## 📞 Support

For questions or issues, please refer to the individual service READMEs or create an issue in the repository.

---

**Built with ❤️ for HNG Stage 4**
