# Template Server - Local Setup Guide

This guide will help you set up and run the template-server locally.

## Prerequisites

- Python 3.11 or higher
- pip (Python package manager)
- PostgreSQL (optional, for production) or SQLite (default for local development)

## Step-by-Step Setup

### 1. Navigate to the Template Server Directory

```bash
cd Services/template-server
```

### 2. Create a Virtual Environment

**Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**
```cmd
python -m venv .venv
.venv\Scripts\activate.bat
```

**Linux/Mac:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Set Up Environment Variables

Create a `.env` file in the `Services/template-server` directory:

**Option A: Using SQLite (Simpler for local development)**
```env
ENV=development
PORT=4003
DATABASE_URL=sqlite+aiosqlite:///./template_service.db
```

**Option B: Using PostgreSQL (If you have PostgreSQL running)**
```env
ENV=development
PORT=4003
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/template_service
```

**Option C: Using PostgreSQL from Docker**
If you have PostgreSQL running in Docker (from docker-compose):
```env
ENV=development
PORT=4003
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/template_service
```

### 5. Run the Server

**Development mode (with auto-reload):**
```bash
uvicorn src.main:app --reload --host 0.0.0.0 --port 4003
```

**Production mode:**
```bash
uvicorn src.main:app --host 0.0.0.0 --port 4003
```

### 6. Verify the Server is Running

- **Health Check:** http://localhost:4003/health
- **API Docs (Swagger):** http://localhost:4003/docs
- **API Docs (ReDoc):** http://localhost:4003/redoc

## Quick Start (All-in-One)

**Windows (PowerShell):**
```powershell
cd Services/template-server
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
# Create .env file with DATABASE_URL=sqlite+aiosqlite:///./template_service.db
uvicorn src.main:app --reload --host 0.0.0.0 --port 4003
```

**Linux/Mac:**
```bash
cd Services/template-server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Create .env file with DATABASE_URL=sqlite+aiosqlite:///./template_service.db
uvicorn src.main:app --reload --host 0.0.0.0 --port 4003
```

## Database Setup

### Using SQLite (Recommended for Local Development)

No additional setup needed! SQLite will create a database file (`template_service.db`) automatically when you first run the server.

### Using PostgreSQL

1. **Install PostgreSQL** (if not already installed):
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. **Create Database:**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE template_service;
   
   # Exit
   \q
   ```

3. **Update .env file:**
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/template_service
   ```

## API Endpoints

Once the server is running, you can test the following endpoints:

### Health Check
```bash
curl http://localhost:4003/health
```

### Create Template
```bash
curl -X POST http://localhost:4003/api/v1/templates/ \
  -H "Content-Type: application/json" \
  -d '{
    "code": "welcome_email",
    "content": "Welcome {{name}}!",
    "language": "en",
    "version": 1
  }'
```

### Get All Templates
```bash
curl http://localhost:4003/api/v1/templates/
```

### Get Template by Code
```bash
curl http://localhost:4003/api/v1/templates/welcome_email
```

### Update Template
```bash
curl -X PUT http://localhost:4003/api/v1/templates/welcome_email \
  -H "Content-Type: application/json" \
  -d '{
    "code": "welcome_email",
    "content": "Welcome {{name}}! We are glad to have you.",
    "language": "en",
    "version": 2
  }'
```

### Delete Template
```bash
curl -X DELETE http://localhost:4003/api/v1/templates/welcome_email
```

## Troubleshooting

### Issue: `ModuleNotFoundError: No module named 'src'`

**Solution:** Make sure you're running the command from the `Services/template-server` directory, and the virtual environment is activated.

### Issue: `Error: [Errno 10048] Only one usage of each socket address`

**Solution:** Port 4003 is already in use. Either:
- Stop the service using port 4003
- Change the port in the `.env` file and uvicorn command

### Issue: `Database connection error`

**Solution:**
- Check if PostgreSQL is running (if using PostgreSQL)
- Verify the `DATABASE_URL` in your `.env` file
- For SQLite, ensure the directory is writable

### Issue: `Permission denied` on Windows

**Solution:** If you get a permission error when activating the virtual environment, run PowerShell as Administrator and execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ENV` | Environment (development/production) | `dev` | No |
| `PORT` | Server port | `4003` | No |
| `DATABASE_URL` | Database connection string | None | Yes |

## Next Steps

1. Test the API using the Swagger UI at http://localhost:4003/docs
2. Create templates for your notifications
3. Integrate with email-server and push-server
4. Deploy using Docker (see `infra/docker-compose.yml`)

