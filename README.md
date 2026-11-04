# SmartSpend — Smart Personal Expense Tracker

A modern personal finance and expense tracking web application engineered for simplicity, reliability, and cross-platform flexibility across **Windows** (development) and **Ubuntu Linux** (Unix shell scripting).

---

## 🛠️ Technology Stack

- **Frontend:** React + Vite + TypeScript (scheduled for Phase 3)
- **Backend:** Python 3.14 + FastAPI + Uvicorn + Pydantic v2
- **Database:** Supabase (Cloud PostgreSQL) via Supabase Python SDK
- **Data Validation:** Pydantic models with strict typing and constraints
- **Scripting:** Unix Shell / Bash (tested on Ubuntu Linux)
- **API Architecture:** RESTful JSON API with OpenAPI / Swagger documentation

---

## 📁 Project Directory Structure

```text
smartspend/
├── frontend/               # React + Vite + TypeScript frontend (Phase 3)
│   └── .gitkeep
├── backend/                # FastAPI backend service
│   ├── app/
│   │   ├── __init__.py     # Package initialization
│   │   ├── main.py         # FastAPI application entrypoint & route registration
│   │   ├── config.py       # Configuration and environment settings
│   │   ├── database.py     # Supabase client singleton & safe connection handling
│   │   ├── schemas/        # Pydantic request & response validation models
│   │   │   ├── __init__.py
│   │   │   └── transaction.py
│   │   ├── routes/         # REST API route handlers
│   │   │   ├── __init__.py
│   │   │   ├── transactions.py  # CRUD endpoints (/api/transactions)
│   │   │   └── analytics.py     # Financial summary endpoint (/api/analytics)
│   │   └── services/       # Business logic & Supabase database queries
│   │       ├── __init__.py
│   │       └── transaction_service.py
│   ├── .venv/              # Isolated Python virtual environment (ignored by Git)
│   ├── requirements.txt    # Pinned dependency specifications
│   ├── verify_db.py        # Database connectivity verification script
│   ├── test_api.py         # Unit test suite (mock database, no external calls)
│   ├── test_live_supabase.py # Live integration test suite (live Supabase instance)
│   ├── .env.example        # Environment variable template
│   ├── .env                # Local secrets (never committed)
│   └── .gitignore          # Backend-specific ignore rules
├── shell/                  # Unix Bash automation & lab scripts (Ubuntu)
│   └── .gitkeep
├── docs/                   # Documentation & database scripts
│   └── schema.sql          # PostgreSQL DDL and RLS policies for Supabase
├── assets/                 # UI references & project branding
│   ├── logo.jpg
│   └── dashboard_reference.jpg
├── .gitignore              # Root Git ignore configuration
└── README.md               # Complete project documentation
```

---

## 🏛️ Backend Architecture

The backend follows a clean, layered architectural pattern designed for high maintainability:

1. **`app/main.py`**:
   Initializes the FastAPI instance, configures CORS middleware for frontend local origins, and registers the API routers.
2. **`app/config.py`**:
   Safely loads environment variables, validates credential formats, and provides centralized settings.
3. **`app/database.py`**:
   Manages the Supabase Python SDK client instance as a reusable FastAPI dependency (`Depends(get_supabase_client)`). Gracefully handles unconfigured states without leaking internal stack traces or secrets.
4. **`app/schemas/transaction.py`**:
   Defines Pydantic models for incoming requests and outgoing responses (`TransactionCreate`, `TransactionUpdate`, `TransactionResponse`, `FinancialSummary`). Enforces amount > 0, currency format, non-empty categories, and prevents empty update payloads.
5. **`app/services/transaction_service.py`**:
   Encapsulates all PostgREST database queries (insert, select, update, delete, summary aggregation). Uses exact `Decimal` arithmetic for financial totals to avoid floating-point inaccuracies.
6. **`app/routes/`**:
   Exposes RESTful HTTP endpoints with clear parameter validation, descriptive OpenAPI annotations, and consistent HTTP status codes.

---

## 📋 API Reference Table

| Method | Endpoint | Description | Status Code | Query / Body Parameters |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/` | Root API metadata & service links | `200 OK` | None |
| **GET** | `/health` | Service health status check | `200 OK` | None |
| **POST** | `/api/transactions` | Create a new income/expense transaction | `201 Created` | JSON body (`TransactionCreate`) |
| **GET** | `/api/transactions` | List transactions (descending by date) | `200 OK` | `type`, `category`, `start_date`, `end_date`, `limit`, `offset` |
| **GET** | `/api/transactions/{id}` | Retrieve one transaction by ID | `200 OK` / `404 Not Found` | `id` (path, integer ≥ 1) |
| **PUT** | `/api/transactions/{id}` | Update an existing transaction record | `200 OK` / `404 Not Found` | `id` (path), JSON body (`TransactionUpdate`) |
| **DELETE**| `/api/transactions/{id}` | Delete a transaction record | `200 OK` / `404 Not Found` | `id` (path, integer ≥ 1) |
| **GET** | `/api/analytics/summary` | Financial summary (income, expense, balance) | `200 OK` | `currency` (query, default: `INR`) |

---

## 🔑 Environment Configuration

In the `backend/` directory, configure your credentials:

```bash
# Windows (PowerShell)
Copy-Item backend\.env.example backend\.env

# Ubuntu Linux (Bash)
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-key
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

> ⚠️ **Security Rules:**
> - Use the **`anon` (public)** key for client/backend operations.
> - **NEVER** expose the `service_role` (secret) key.
> - Keep `.env` strictly untracked by Git (verified in `.gitignore`).

---

## 🚀 Running FastAPI Locally

### Windows (PowerShell)

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

### Ubuntu Linux (Bash)

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Interactive Documentation

Once the server is running, open:
- **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🧪 Testing

### 1. Database Connectivity Check
Verifies connectivity to the Supabase `transactions` table without printing secrets:

```bash
# Windows PowerShell
.\backend\.venv\Scripts\python.exe backend\verify_db.py

# Ubuntu Bash
python3 backend/verify_db.py
```

### 2. Unit Test Suite (Automated Mocks)
Runs 12 unit tests validating all schemas, routes, query filters, and error handlers:

```bash
# Windows PowerShell
$env:PYTHONPATH='backend'; .\backend\.venv\Scripts\python.exe backend/test_api.py

# Ubuntu Bash
PYTHONPATH=backend python3 backend/test_api.py
```

### 3. Live Integration Test Suite
Executes real operations against your Supabase database and verifies persistence:

```bash
# Windows PowerShell
$env:PYTHONPATH='backend'; .\backend\.venv\Scripts\python.exe backend/test_live_supabase.py

# Ubuntu Bash
PYTHONPATH=backend python3 backend/test_live_supabase.py
```

---

## 💡 Example CRUD Requests

### 1. Create an Income Transaction
```http
POST /api/transactions
Content-Type: application/json

{
  "type": "income",
  "amount": 45000.00,
  "category": "Salary",
  "description": "November Paycheck",
  "currency": "INR",
  "transaction_date": "2026-11-01"
}
```

### 2. Create an Expense Transaction
```http
POST /api/transactions
Content-Type: application/json

{
  "type": "expense",
  "amount": 350.00,
  "category": "Food",
  "description": "Lunch with colleagues",
  "currency": "INR",
  "transaction_date": "2026-11-04"
}
```

### 3. Filter Transactions by Date and Type
```http
GET /api/transactions?type=expense&start_date=2026-11-01&end_date=2026-11-30&limit=50
```

### 4. Update an Existing Transaction
```http
PUT /api/transactions/1
Content-Type: application/json

{
  "amount": 400.00,
  "description": "Lunch + dessert"
}
```

### 5. Get Financial Summary
```http
GET /api/analytics/summary?currency=INR
```
*Sample Response:*
```json
{
  "total_income": 45000.0,
  "total_expenses": 400.0,
  "balance": 44600.0,
  "currency": "INR"
}
```
