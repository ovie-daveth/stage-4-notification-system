# Docker Quick Start Guide

## Running Docker Services

### Method 1: Using PowerShell Script (Recommended for Windows)

**From the project root directory:**

```powershell
# Run the wrapper script
.\docker-start.ps1
```

**Or navigate to infra directory first:**

```powershell
cd infra
.\docker-start.ps1
```

**If you get an execution policy error, run:**

```powershell
powershell -ExecutionPolicy Bypass -File .\docker-start.ps1
```

### Method 2: Using Docker Compose Directly

1. **Navigate to infra directory:**
   ```powershell
   cd infra
   ```

2. **Start all services:**
   ```powershell
   docker-compose up -d
   ```

3. **View logs:**
   ```powershell
   docker-compose logs -f
   ```

4. **Stop services:**
   ```powershell
   docker-compose down
   ```

## Service URLs

After starting the services, you can access:

- **RabbitMQ Management UI**: http://localhost:15672
  - Username: `admin`
  - Password: `admin123`

- **Email Service API**: http://localhost:4002
- **Email Swagger Docs**: http://localhost:4002/docs
- **Email Health Check**: http://localhost:4002/health

- **Push Service API**: http://localhost:4004
- **Push Swagger Docs**: http://localhost:4004/docs
- **Push Health Check**: http://localhost:4004/health

## Troubleshooting

### Script Not Found Error

If you see "The term '.\docker-start.ps1' is not recognized":

1. **Check you're in the correct directory:**
   ```powershell
   Get-Location
   # Should be: ...\stage-4-notification-system
   ```

2. **Verify the script exists:**
   ```powershell
   Test-Path ".\docker-start.ps1"
   # Should return: True
   ```

3. **Try running with full path:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\docker-start.ps1
   ```

### Docker Not Running

If you see "Docker is not running":

1. Start Docker Desktop
2. Wait for Docker to fully start
3. Verify Docker is running:
   ```powershell
   docker info
   ```

### Port Already in Use

If you see port conflict errors:

1. **Check which process is using the port:**
   ```powershell
   netstat -ano | findstr "4002"
   netstat -ano | findstr "4004"
   netstat -ano | findstr "5672"
   ```

2. **Stop the conflicting service or change ports in docker-compose.yml**

### Services Won't Start

1. **Check service logs:**
   ```powershell
   cd infra
   docker-compose logs
   ```

2. **Verify RabbitMQ is healthy:**
   ```powershell
   docker-compose ps
   ```

3. **Restart services:**
   ```powershell
   docker-compose down
   docker-compose up -d
   ```

## Environment Configuration

### Email Service

Create a `.env` file in the `infra` directory or set environment variables:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=no-reply@example.com
```

### Push Service

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
FIREBASE_PROJECT_ID=your-project-id
```

Or use a file path:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/service-account.json
```

## Next Steps

1. Configure SMTP credentials for email service
2. Configure Firebase credentials for push service
3. Update service URLs if user-server and template-server are running separately
4. Test the services using Swagger UI or Postman

For more detailed information, see `infra/README.md`.

