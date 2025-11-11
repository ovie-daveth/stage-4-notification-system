# 🧩 Template Service (SegunO)

Handles creation, retrieval, update, and deletion of notification templates for the distributed notification system.

---

## ⚙️ Tech Stack
- **Framework:** FastAPI  
- **Database (local):** SQLite  
- **Database (production):** PostgreSQL (via Docker)  
- **ORM:** SQLAlchemy (async)  
- **Validation:** Pydantic  

---

## 🧠 Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/templates/ | Create a new template |
| GET | /api/v1/templates/ | List all templates |
| GET | /api/v1/templates/{code} | Retrieve single template |
| PUT | /api/v1/templates/{code} | Update a template |
| DELETE | /api/v1/templates/{code} | Delete a template |
| GET | /health | Health check |

---

## 🧪 Local Setup
```bash
# Create and activate venv
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run service
uvicorn src.main:app --reload
