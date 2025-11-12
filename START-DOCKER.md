# Quick Start Guide - Running Docker Services

## Option 1: Using Docker Compose Directly (Simplest)

1. **Open PowerShell and navigate to the project directory:**
   ```powershell
   cd "C:\Users\ovie.omokefe\OneDrive - Premium Trust Bank Limited\Desktop\Personal\hng\stage-4-notification-system\infra"
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

## Option 2: Using PowerShell Script

1. **Navigate to the project root:**
   ```powershell
   cd "C:\Users\ovie.omokefe\OneDrive - Premium Trust Bank Limited\Desktop\Personal\hng\stage-4-notification-system"
   ```

2. **Run the script:**
   ```powershell
   .\docker-start.ps1
   ```

   Or if you get an execution policy error:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\docker-start.ps1
   ```

## Option 3: Navigate to infra directory first

1. **Navigate to infra directory:**
   ```powershell
   cd "C:\Users\ovie.omokefe\OneDrive - Premium Trust Bank Limited\Desktop\Personal\hng\stage-4-notification-system\infra"
   ```

2. **Run the script:**
   ```powershell
   .\docker-start.ps1
   ```

## Service URLs

After starting, access:

- **RabbitMQ Management**: http://localhost:15672 (admin/admin123)
- **Email Service**: http://localhost:4002
- **Email Swagger**: http://localhost:4002/docs
- **Push Service**: http://localhost:4004
- **Push Swagger**: http://localhost:4004/docs

## Troubleshooting

### Script Not Found
Make sure you're in the correct directory:
```powershell
Get-Location
# Should show: ...\stage-4-notification-system
```

### Docker Not Running
Start Docker Desktop and wait for it to fully start.

### Port Conflicts
Check if ports are already in use:
```powershell
netstat -ano | findstr "4002"
netstat -ano | findstr "4004"
netstat -ano | findstr "5672"
```

