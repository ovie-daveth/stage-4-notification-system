# Docker Setup for Notification Services

This directory contains Docker Compose configuration for running the notification services (user-server, email-server, push-server, and template-server) along with RabbitMQ, MongoDB, and PostgreSQL.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine + Docker Compose (Linux)
- Docker version 20.10 or later
- Docker Compose version 2.0 or later

## Quick Start

### Option 1: Using the PowerShell Script (Windows)

1. **From the project root directory, run:**
   ```powershell
   .\docker-start.ps1
   ```
   
   Or if running directly from infra directory:
   ```powershell
   cd infra
   .\docker-start.ps1
   ```

### Option 2: Using Docker Compose Directly

1. **Navigate to the infra directory:**
   ```bash
   cd infra
   ```

2. **Create a `.env` file** (optional, for custom configuration):
   ```bash
   # Create .env file with your configuration
   # See environment variables section below
   ```
   Edit `.env` and update the following:
   - `SMTP_USERNAME` and `SMTP_PASSWORD` for email service
   - `FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_SERVICE_ACCOUNT_PATH` for push service
   - `JWT_SECRET` for user service (change in production)
   - Service URLs if running template-server separately

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **View logs:**
   ```bash
   # All services
   docker-compose logs -f
   
   # Specific service
   docker-compose logs -f user-server
   docker-compose logs -f email-server
   docker-compose logs -f push-server
   docker-compose logs -f template-server
   docker-compose logs -f mongodb
   docker-compose logs -f postgresql
   ```

5. **Stop all services:**
   ```bash
   docker-compose down
   ```

6. **Stop and remove volumes:**
   ```bash
   docker-compose down -v
   ```

## Services

### RabbitMQ
- **Port:** 5672 (AMQP), 15672 (Management UI)
- **Management UI:** http://localhost:15672
- **Default Credentials:** admin / admin123
- **Health Check:** Enabled
- **Persistent Volume:** rabbitmq_data

### MongoDB
- **Port:** 27017
- **Health Check:** Enabled
- **Database:** notification_system
- **Persistent Volume:** mongodb_data

### PostgreSQL
- **Port:** 5432
- **Health Check:** Enabled
- **Database:** template_service
- **Default Credentials:** postgres / postgres
- **Persistent Volume:** postgresql_data

### User Server
- **Port:** 4001
- **API:** http://localhost:4001
- **Health Check:** http://localhost:4001/health
- **Depends on:** MongoDB
- **Features:** User management, authentication, push token management

### Email Server
- **Port:** 4002
- **API:** http://localhost:4002
- **Swagger Docs:** http://localhost:4002/docs
- **Health Check:** http://localhost:4002/health
- **Depends on:** RabbitMQ, User Service, Template Service

### Push Server
- **Port:** 4004
- **API:** http://localhost:4004
- **Swagger Docs:** http://localhost:4004/docs
- **Health Check:** http://localhost:4004/health
- **Depends on:** RabbitMQ, User Service, Template Service

### Template Server
- **Port:** 4003
- **API:** http://localhost:4003
- **Swagger Docs:** http://localhost:4003/docs (if configured)
- **Health Check:** http://localhost:4003/health
- **Depends on:** PostgreSQL
- **Features:** Template management, template rendering

## Environment Variables

### User Service
- `MONGODB_URI` - MongoDB connection string (default: mongodb://mongodb:27017/notification_system)
- `JWT_SECRET` - JWT secret key for token signing (default: change_this_secret_in_production)
- `JWT_EXPIRES_IN` - JWT token expiration time (default: 7d)
- `PORT` - Service port (default: 4001)
- `CORS_ORIGIN` - CORS allowed origin (default: http://localhost:3000)

### Email Service
- `SMTP_HOST` - SMTP server host (default: smtp.gmail.com)
- `SMTP_PORT` - SMTP server port (default: 587)
- `SMTP_SECURE` - Use TLS (default: false)
- `SMTP_USERNAME` - SMTP username
- `SMTP_PASSWORD` - SMTP password/app password
- `EMAIL_FROM` - Default sender email address

### Push Service
- `FIREBASE_SERVICE_ACCOUNT_JSON` - Firebase service account JSON as string
- `FIREBASE_SERVICE_ACCOUNT_PATH` - Path to Firebase service account file (alternative to JSON)
- `FIREBASE_PROJECT_ID` - Firebase project ID (optional, uses credential project_id if not set)

### Template Service
- `DATABASE_URL` - PostgreSQL connection string (default: postgresql+asyncpg://postgres:postgres@postgresql:5432/template_service)
- `PORT` - Service port (default: 4003)
- `ENV` - Environment (default: production)

### Common
- `RABBITMQ_URI` - RabbitMQ connection string (automatically set in docker-compose)
- `USER_SERVICE_URL` - User service endpoint (default: http://user-server:4001/api/v1)
- `TEMPLATE_SERVICE_URL` - Template service endpoint (default: http://template-server:4003/api/v1)
- `CORS_ORIGIN` - CORS allowed origin (default: http://localhost:3000)
- `POSTGRES_USER` - PostgreSQL username (default: postgres)
- `POSTGRES_PASSWORD` - PostgreSQL password (default: postgres)
- `POSTGRES_DB` - PostgreSQL database name (default: template_service)

## Building Images

To rebuild the images:

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build user-server
docker-compose build email-server
docker-compose build push-server
docker-compose build template-server

# Build without cache
docker-compose build --no-cache
```

## Development Mode

For development with hot reload, you can mount the source code as volumes:

```yaml
# Add to docker-compose.yml under each service:
volumes:
  - ../Services/user-server:/app
  - /app/node_modules
```

Then run with `nodemon` instead of `node` by overriding the CMD in docker-compose.yml.

## Troubleshooting

### Services won't start
- Check if ports are already in use: `netstat -an | findstr "4001 4002 4003 4004 5432 5672 15672 27017"`
- Ensure RabbitMQ, MongoDB, and PostgreSQL are healthy: `docker-compose ps`
- Check logs: `docker-compose logs rabbitmq` or `docker-compose logs mongodb` or `docker-compose logs postgresql`
- Verify user-server is healthy before email-server and push-server start
- Verify template-server is healthy before email-server and push-server start

### Email service fails to connect to SMTP
- Verify SMTP credentials in `.env`
- For Gmail, use an App Password (not your regular password)
- Check if 2FA is enabled on your Gmail account
- Try port 465 with `SMTP_SECURE=true` for SSL

### Push service fails to initialize Firebase
- Verify `FIREBASE_SERVICE_ACCOUNT_JSON` is valid JSON
- Ensure the service account has Firebase Cloud Messaging permissions
- Check logs: `docker-compose logs push-server`

### User service fails to connect to MongoDB
- Wait for MongoDB to be healthy (check health status)
- Verify MongoDB URI in docker-compose.yml: `mongodb://mongodb:27017/notification_system`
- Check network connectivity: `docker-compose exec user-server ping mongodb`
- Check logs: `docker-compose logs mongodb`

### Template service fails to connect to PostgreSQL
- Wait for PostgreSQL to be healthy (check health status)
- Verify DATABASE_URL in docker-compose.yml: `postgresql+asyncpg://postgres:postgres@postgresql:5432/template_service`
- Check network connectivity: `docker-compose exec template-server ping postgresql`
- Check logs: `docker-compose logs postgresql`

### Services can't connect to RabbitMQ
- Wait for RabbitMQ to be healthy (check health status)
- Verify RabbitMQ credentials match in docker-compose.yml
- Check network connectivity: `docker-compose exec email-server ping rabbitmq`

### Services can't connect to User Service
- Wait for user-server to be healthy (check health status)
- Verify USER_SERVICE_URL is correct: `http://user-server:4001/api/v1`
- Check network connectivity: `docker-compose exec email-server ping user-server`
- Check logs: `docker-compose logs user-server`

### Services can't connect to Template Service
- Wait for template-server to be healthy (check health status)
- Verify TEMPLATE_SERVICE_URL is correct: `http://template-server:4003/api/v1`
- Check network connectivity: `docker-compose exec email-server ping template-server`
- Check logs: `docker-compose logs template-server`

## Production Considerations

1. **Security:**
   - Change RabbitMQ default credentials
   - Change JWT_SECRET to a strong random value
   - Use Docker secrets for sensitive environment variables
   - Enable TLS for RabbitMQ and MongoDB
   - Use secure SMTP connections (TLS/SSL)

2. **Performance:**
   - Adjust `RABBITMQ_PREFETCH` based on workload
   - Configure resource limits in docker-compose.yml
   - Use multi-stage builds for smaller images
   - Configure MongoDB indexes for better query performance

3. **Monitoring:**
   - Add logging aggregation (ELK, Loki, etc.)
   - Set up health check monitoring
   - Configure alerting for service failures

4. **Scaling:**
   - Run multiple instances of email-server and push-server
   - Use a load balancer for HTTP endpoints
   - Configure RabbitMQ clustering for high availability
   - Configure MongoDB replica set for high availability

## Network

All services are connected to the `notification-network` bridge network, allowing them to communicate using service names as hostnames.

## Volumes

- `rabbitmq_data` - Persistent storage for RabbitMQ data and queues
- `mongodb_data` - Persistent storage for MongoDB database
- `postgresql_data` - Persistent storage for PostgreSQL database

## Health Checks

All services include health checks:
- RabbitMQ: Uses `rabbitmq-diagnostics ping`
- MongoDB: Uses `mongosh` to ping database
- PostgreSQL: Uses `pg_isready` to check database readiness
- User Server: HTTP GET /health
- Email Server: HTTP GET /health
- Push Server: HTTP GET /health
- Template Server: HTTP GET /health

Service startup order:
1. RabbitMQ, MongoDB, and PostgreSQL start first
2. User Server starts after MongoDB is healthy
3. Template Server starts after PostgreSQL is healthy
4. Email Server and Push Server start after RabbitMQ is healthy, User Server has started, and Template Server has started
