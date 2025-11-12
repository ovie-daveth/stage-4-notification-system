# Docker Setup for Notification Services

This directory contains Docker Compose configuration for running the notification services (email-server and push-server) along with RabbitMQ.

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
   - Service URLs if running user-server and template-server separately

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **View logs:**
   ```bash
   # All services
   docker-compose logs -f
   
   # Specific service
   docker-compose logs -f email-server
   docker-compose logs -f push-server
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

## Environment Variables

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

### Common
- `RABBITMQ_URI` - RabbitMQ connection string (automatically set in docker-compose)
- `USER_SERVICE_URL` - User service endpoint (default: http://user-server:4001/api/v1)
- `TEMPLATE_SERVICE_URL` - Template service endpoint (default: http://template-server:4003/api/v1)
- `CORS_ORIGIN` - CORS allowed origin (default: http://localhost:3000)

## Building Images

To rebuild the images:

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build email-server
docker-compose build push-server

# Build without cache
docker-compose build --no-cache
```

## Development Mode

For development with hot reload, you can mount the source code as volumes:

```yaml
# Add to docker-compose.yml under each service:
volumes:
  - ../Services/email-server:/app
  - /app/node_modules
```

Then run with `nodemon` instead of `node` by overriding the CMD in docker-compose.yml.

## Troubleshooting

### Services won't start
- Check if ports are already in use: `netstat -an | findstr "4002 4004 5672 15672"`
- Ensure RabbitMQ is healthy: `docker-compose ps`
- Check logs: `docker-compose logs rabbitmq`

### Email service fails to connect to SMTP
- Verify SMTP credentials in `.env`
- For Gmail, use an App Password (not your regular password)
- Check if 2FA is enabled on your Gmail account
- Try port 465 with `SMTP_SECURE=true` for SSL

### Push service fails to initialize Firebase
- Verify `FIREBASE_SERVICE_ACCOUNT_JSON` is valid JSON
- Ensure the service account has Firebase Cloud Messaging permissions
- Check logs: `docker-compose logs push-server`

### Services can't connect to RabbitMQ
- Wait for RabbitMQ to be healthy (check health status)
- Verify RabbitMQ credentials match in docker-compose.yml
- Check network connectivity: `docker-compose exec email-server ping rabbitmq`

## Production Considerations

1. **Security:**
   - Change RabbitMQ default credentials
   - Use Docker secrets for sensitive environment variables
   - Enable TLS for RabbitMQ
   - Use secure SMTP connections (TLS/SSL)

2. **Performance:**
   - Adjust `RABBITMQ_PREFETCH` based on workload
   - Configure resource limits in docker-compose.yml
   - Use multi-stage builds for smaller images

3. **Monitoring:**
   - Add logging aggregation (ELK, Loki, etc.)
   - Set up health check monitoring
   - Configure alerting for service failures

4. **Scaling:**
   - Run multiple instances of email-server and push-server
   - Use a load balancer for HTTP endpoints
   - Configure RabbitMQ clustering for high availability

## Network

All services are connected to the `notification-network` bridge network, allowing them to communicate using service names as hostnames.

## Volumes

- `rabbitmq_data` - Persistent storage for RabbitMQ data and queues

## Health Checks

All services include health checks:
- RabbitMQ: Uses `rabbitmq-diagnostics ping`
- Email Server: HTTP GET /health
- Push Server: HTTP GET /health

Services wait for RabbitMQ to be healthy before starting.

