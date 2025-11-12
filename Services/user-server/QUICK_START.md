# Quick Start Guide - MongoDB Setup

## Option 1: MongoDB Atlas (Recommended - No Local Installation)

1. **Create MongoDB Atlas Account:**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for a free account
   - Create a free cluster (M0)

2. **Create Database User:**
   - Go to "Database Access" → "Add New Database User"
   - Choose "Password" authentication
   - Set username and password (remember these!)
   - Click "Add User"

3. **Whitelist IP Address:**
   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

4. **Get Connection String:**
   - Go to "Database" → Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`)

5. **Update `.env` file:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notification_system?retryWrites=true&w=majority
   ```
   Replace:
   - `username` with your database username
   - `password` with your database password
   - `cluster.mongodb.net` with your cluster URL
   - `notification_system` with your database name

6. **Start the service:**
   ```powershell
   npm run dev
   ```

## Option 2: Local MongoDB (Requires Installation)

1. **Install MongoDB:**
   - Download from https://www.mongodb.com/try/download/community
   - Or use Chocolatey: `choco install mongodb`

2. **Start MongoDB:**
   ```powershell
   # Start MongoDB service
   net start MongoDB
   
   # Or if service is not installed, run manually:
   mongod --dbpath "C:\data\db"
   ```
   (Create `C:\data\db` directory if it doesn't exist)

3. **Verify MongoDB is running:**
   ```powershell
   # Check if MongoDB is running on port 27017
   netstat -an | findstr 27017
   ```

4. **Start the service:**
   ```powershell
   npm run dev
   ```

## Option 3: Docker (Quick Setup)

1. **Install Docker Desktop:**
   - Download from https://www.docker.com/products/docker-desktop

2. **Run MongoDB in Docker:**
   ```powershell
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

3. **Verify MongoDB is running:**
   ```powershell
   docker ps
   ```

4. **Start the service:**
   ```powershell
   npm run dev
   ```

## Verify Setup

1. **Check Service Health:**
   ```powershell
   Invoke-RestMethod -Uri http://localhost:4001/health
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

## Troubleshooting

### MongoDB Connection Refused

**Error:**
```
connect ECONNREFUSED ::1:27017, connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions:**
1. **Check if MongoDB is running:**
   ```powershell
   Get-Service MongoDB
   netstat -an | findstr 27017
   ```

2. **Start MongoDB:**
   ```powershell
   net start MongoDB
   ```

3. **Check MongoDB Installation:**
   ```powershell
   mongod --version
   ```

4. **Create Data Directory:**
   ```powershell
   mkdir C:\data\db
   mongod --dbpath "C:\data\db"
   ```

### MongoDB Atlas Connection Issues

1. **Check IP Whitelist:**
   - Go to MongoDB Atlas → Network Access
   - Ensure your IP is whitelisted (or use `0.0.0.0/0` for all IPs)

2. **Check Connection String:**
   - Ensure username and password are correct
   - Ensure special characters in password are URL-encoded
   - Check if database name is correct

3. **Check Cluster Status:**
   - Ensure cluster is running (not paused)
   - Free tier clusters may pause after inactivity

## Next Steps

- Test all endpoints using Postman or curl
- Integrate with Email and Push services
- Set up API Gateway
- Configure production environment

