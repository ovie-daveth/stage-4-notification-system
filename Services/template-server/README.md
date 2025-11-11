# Template Service

Manages notification templates for the distributed notification system.

### ⚙️ Setup
```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.main:app --reload

🧩 Endpoints
Method	Path	Description
POST	/api/v1/templates/	Create a template
GET	/api/v1/templates/	List templates
GET	/api/v1/templates/{code}	Fetch one template
PUT	/api/v1/templates/{code}	Update template
DELETE	/api/v1/templates/{code}	Delete template
GET	/health	Health check

Response format → { success, data, error, message, meta }

---


---

## ▶️ 5. Run Locally

### Step 1 – Create DB
```bash
# Open PostgreSQL and create database
createdb template_db

uvicorn src.main:app --reload

Visit →
Docs: http://127.0.0.1:8000/docs
Health: http://127.0.0.1:8000/health