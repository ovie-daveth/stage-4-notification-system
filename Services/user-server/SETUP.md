# User Service Setup Guide

## Prerequisites

### Option 1: Local MongoDB (Recommended for Development)

1. **Install MongoDB Community Edition:**
   - Windows: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - Or use Chocolatey: `choco install mongodb`
   - Or use Scoop: `scoop install mongodb`

2. **Start MongoDB Service:**
   ```powershell
   # Start MongoDB service (Windows)
   net start MongoDB
   
   # Or if installed manually, start MongoDB:
   mongod --dbpath "C:\data\db"
   ```

3. **Verify MongoDB is Running:**
   ```powershell
   # Check if MongoDB is running on port 27017
   netstat -an | findstr 27017
   ```

### Option 2: MongoDB Atlas (Cloud - Recommended for Production)

1. **Create a Free MongoDB Atlas Account:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account
   - Create a new cluster (free tier available)

2. **Get Connection String:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with your database name (e.g., `notification_system`)

3. **Update `.env` file:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notification_system?retryWrites=true&w=majority
   ```

### Option 3: Docker (Quick Setup)

1. **Install Docker Desktop:**
   - Download from [Docker Desktop](https://www.docker.com/products/docker-desktop)

2. **Run MongoDB in Docker:**
   ```powershell
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

3. **Verify MongoDB is Running:**
   ```powershell
   docker ps
   ```

## Setup Steps

1. **Install Dependencies:**
   ```powershell
   cd userService
   npm install
   ```

2. **Create `.env` file:**
   ```powershell
   cp env.example .env
   ```

3. **Configure Environment Variables:**
   Edit `.env` file and update:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - A strong secret key for JWT tokens
   - `PORT` - Service port (default: 4001)

4. **Start MongoDB (if using local MongoDB):**
   ```powershell
   # Windows Service
   net start MongoDB
   
   # Or manually
   mongod --dbpath "C:\data\db"
   ```

5. **Start the User Service:**
   ```powershell
   npm run dev
   ```

## Troubleshooting

### MongoDB Connection Refused Error

**Error:**
```
connect ECONNREFUSED ::1:27017, connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions:**

1. **Check if MongoDB is Running:**
   ```powershell
   # Check MongoDB service status
   Get-Service MongoDB
   
   # Or check if port 27017 is listening
   netstat -an | findstr 27017
   ```

2. **Start MongoDB Service:**
   ```powershell
   net start MongoDB
   ```

3. **Check MongoDB Installation:**
   ```powershell
   # Verify MongoDB is installed
   mongod --version
   ```

4. **Check MongoDB Data Directory:**
   ```powershell
   # Create data directory if it doesn't exist
   mkdir C:\data\db
   
   # Start MongoDB with data directory
   mongod --dbpath "C:\data\db"
   ```

5. **Firewall Issues:**
   - Ensure port 27017 is not blocked by Windows Firewall
   - Add MongoDB to firewall exceptions if needed

### MongoDB Atlas Connection Issues

1. **Whitelist IP Address:**
   - Go to MongoDB Atlas → Network Access
   - Add your IP address (or use `0.0.0.0/0` for all IPs - development only)

2. **Check Connection String:**
   - Ensure username and password are correct
   - Ensure database name is correct
   - Check if special characters in password are URL-encoded

3. **Check Cluster Status:**
   - Ensure your cluster is running (not paused)
   - Free tier clusters pause after inactivity

### Other Issues

1. **Port Already in Use:**
   ```powershell
   # Check if port 4001 is in use
   netstat -an | findstr 4001
   
   # Change PORT in .env file
   PORT=4002
   ```

2. **JWT Secret Not Set:**
   - Ensure `JWT_SECRET` is set in `.env` file
   - Use a strong, random secret key

3. **Module Not Found:**
   ```powershell
   # Reinstall dependencies
   rm -r node_modules
   npm install
   ```

## Quick Start with MongoDB Atlas

1. **Create MongoDB Atlas Account:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for free account

2. **Create Cluster:**
   - Click "Build a Database"
   - Choose free tier (M0)
   - Select your preferred region
   - Click "Create"

3. **Create Database User:**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Set username and password
   - Click "Add User"

4. **Whitelist IP Address:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

5. **Get Connection String:**
   - Go to "Database"
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

6. **Update `.env` file:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notification_system?retryWrites=true&w=majority
   ```

7. **Start the Service:**
   ```powershell
   npm run dev
   ```

## Verification

1. **Check Service Health:**
   ```powershell
   # Using PowerShell
   Invoke-RestMethod -Uri http://localhost:4001/health
   
   # Or using curl
   curl http://localhost:4001/health
   ```

2. **Register a Test User:**
   ```powershell
   $body = @{
       email = "test@example.com"
       password = "password123"
       first_name = "Test"
       last_name = "User"
   } | ConvertTo-Json
   
   Invoke-RestMethod -Uri http://localhost:4001/api/v1/users -Method POST -Body $body -ContentType "application/json"
   ```

3. **Login:**
   ```powershell
   $body = @{
       email = "test@example.com"
       password = "password123"
   } | ConvertTo-Json
   
   Invoke-RestMethod -Uri http://localhost:4001/api/v1/users/login -Method POST -Body $body -ContentType "application/json"
   ```

## Next Steps

- Test all endpoints using Postman or curl
- Integrate with Email and Push services
- Set up API Gateway to route requests
- Configure production environment variables
- Set up monitoring and logging

