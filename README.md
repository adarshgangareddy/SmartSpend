# SmartSpend — Smart Personal Expense Tracker

A modern personal finance and expense tracking web application engineered for simplicity, reliability, and cross-platform flexibility across **Windows** (web application development) and **Ubuntu Linux** (Unix shell scripting lab).

---

## 🛠️ Technology Stack

- **Frontend:** React 19 + Vite 8 + TypeScript + Tailwind CSS + Lucide Icons + Recharts
- **Backend:** Python 3.14 + FastAPI + Uvicorn + Pydantic v2
- **Database:** Supabase (Cloud PostgreSQL) via Supabase Python SDK
- **Data Validation:** Pydantic models with strict typing and numeric constraints
- **Scripting:** Unix Shell / Bash (tested on Ubuntu Linux)
- **API Architecture:** RESTful JSON API with OpenAPI / Swagger documentation

---

## 📁 Project Directory Structure

```text
smartspend/
├── frontend/                     # React + Vite + TypeScript frontend
│   ├── src/
│   │   ├── assets/               # Brand logos and static images
│   │   ├── components/           # UI components
│   │   │   ├── Sidebar.tsx       # Fixed desktop & responsive mobile navigation
│   │   │   ├── Dashboard.tsx     # Overview dashboard with greeting & month selector
│   │   │   ├── SummaryCard.tsx   # Income, Expense, and Balance KPI cards
│   │   │   ├── AnalyticsCharts.tsx # Recharts Income vs Expenses & Category Breakdown
│   │   │   ├── RecentTransactions.tsx # Compact recent activity feed
│   │   │   ├── TransactionsPage.tsx  # Full transactions table with filters & search
│   │   │   ├── TransactionModal.tsx  # Clean modal dialog for Add & Edit
│   │   │   └── SettingsPage.tsx  # Currency, lab info, and system preferences
│   │   ├── services/
│   │   │   └── api.ts            # Typed REST API client for backend communication
│   │   ├── types/
│   │   │   └── index.ts          # TypeScript domain models & interfaces
│   │   ├── App.tsx               # Primary layout & state management
│   │   ├── main.tsx              # React DOM entrypoint
│   │   ├── index.css             # Tailwind base and custom scrollbars
│   │   └── vite-env.d.ts         # Vite client type definitions
│   ├── index.html                # HTML template with Plus Jakarta Sans typography
│   ├── package.json              # Frontend dependencies and build scripts
│   ├── tailwind.config.js        # Minimalist neutral & emerald/coral theme configuration
│   ├── tsconfig.json             # TypeScript compiler settings
│   └── vite.config.ts            # Vite build setup with `/api` reverse proxy
├── backend/                      # FastAPI backend service
│   ├── app/
│   │   ├── __init__.py           # Package initialization
│   │   ├── main.py               # FastAPI application entrypoint & route registration
│   │   ├── config.py             # Configuration and environment settings
│   │   ├── database.py           # Supabase client singleton & safe connection handling
│   │   ├── schemas/              # Pydantic request & response validation models
│   │   │   ├── __init__.py
│   │   │   └── transaction.py
│   │   ├── routes/               # REST API route handlers
│   │   │   ├── __init__.py
│   │   │   ├── transactions.py   # CRUD endpoints (/api/transactions)
│   │   │   └── analytics.py      # Financial summary endpoint (/api/analytics)
│   │   └── services/             # Business logic & Supabase database queries
│   │       ├── __init__.py
│   │       └── transaction_service.py
│   ├── .venv/                    # Isolated Python virtual environment (ignored by Git)
│   ├── requirements.txt          # Pinned dependency specifications
│   ├── verify_db.py              # Database connectivity verification script
│   ├── test_api.py               # Unit test suite (mock database, no external calls)
│   ├── test_live_supabase.py     # Live integration test suite (live Supabase instance)
│   ├── .env.example              # Environment variable template
│   ├── .env                      # Local secrets (never committed)
│   └── .gitignore                # Backend-specific ignore rules
├── shell/                        # Unix Bash automation & lab scripts (Ubuntu)
│   └── .gitkeep
├── docs/                         # Documentation & database scripts
│   └── schema.sql                # PostgreSQL DDL and RLS policies for Supabase
├── assets/                       # UI references & project branding
│   ├── logo.jpg
│   └── dashboard_reference.jpg
├── .gitignore                    # Root Git ignore configuration
└── README.md                     # Complete project documentation
```

---

## 🎨 Frontend Design & Architecture

The UI is built according to clean, minimalist personal finance dashboard standards:
- **Color Palette:** Soft off-white canvas (`#F8F9FA`), crisp white cards with subtle borders (`#E2E8F0`), dark charcoal text (`#0F172A`), muted emerald green for income (`#10B981`), and muted coral red for expenses (`#EF4444`).
- **Sidebar Navigation:** Fixed left sidebar featuring the SmartSpend logo, active tab highlighting, and profile status. Collapsible on tablet and mobile.
- **Dynamic Charts:** Built with Recharts using actual data from Supabase (Income vs. Expenses area chart and spending category distribution donut).
- **CRUD Experience:** Non-intrusive modal for adding and editing transactions, inline deletion confirmations, and real-time category/date filtering.

---

## 🚀 Running the Application Locally

### 1. Start the Backend API (Port 8000)

**Windows (PowerShell):**
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

**Ubuntu Linux (Bash):**
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### 2. Start the Frontend Development Server (Port 5173)

Open a separate terminal window:

```bash
cd frontend
npm install
npm run dev
```

Open your browser to:
- **Web App:** [http://localhost:5173](http://localhost:5173)
- **FastAPI Swagger Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

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

## 🧪 Testing

### Backend Unit & Integration Tests

```powershell
# Windows PowerShell
$env:PYTHONPATH='backend'; .\backend\.venv\Scripts\python.exe backend/test_api.py
$env:PYTHONPATH='backend'; .\backend\.venv\Scripts\python.exe backend/test_live_supabase.py
```

### Frontend Type-Checking & Production Build

```powershell
cd frontend
npm run build
```
*(Compiled successfully with 0 errors via TypeScript & Vite)*
