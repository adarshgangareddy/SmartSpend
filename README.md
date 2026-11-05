# SmartSpend — Smart Personal Expense Tracker

A modern personal finance and expense tracking application engineered for simplicity, reliability, and cross-platform flexibility across **Windows** (web application development) and **Ubuntu Linux** (Unix shell programming lab).

---

## 🛠️ Technology Stack

- **Frontend:** React 19 + Vite 8 + TypeScript + Tailwind CSS + Lucide Icons + Recharts
- **Backend:** Python 3.14 + FastAPI + Uvicorn + Pydantic v2
- **Database:** Supabase (Cloud PostgreSQL) via Supabase Python SDK
- **Data Validation:** Pydantic models with strict typing and numeric constraints
- **Unix Shell CLI:** Bash + `curl` + `jq` (designed for Ubuntu Linux)
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
│   └── smartspend.sh             # Interactive terminal CLI (Phase 4)
├── docs/                         # Documentation & database scripts
│   └── schema.sql                # Complete PostgreSQL DDL & RLS policies for Supabase
├── assets/                       # UI references & project branding
│   ├── logo.jpg
│   └── dashboard_reference.jpg
├── .gitignore                    # Root Git ignore configuration
└── README.md                     # Complete project documentation
```

---

## 🖥️ Unix Shell Programming Lab (Bash CLI)

The project includes an interactive Bash CLI in [`shell/smartspend.sh`](shell/smartspend.sh) for your Unix Shell Programming Lab. It communicates with the same FastAPI REST API and persists data to the same Supabase PostgreSQL database as the React web application.

### Prerequisites (Ubuntu Linux)

Install the required command-line tools:

```bash
sudo apt update
sudo apt install -y curl jq gawk coreutils
```

### Running the CLI on Ubuntu Linux

1. Ensure the FastAPI backend is running (either locally or on your network):
   ```bash
   cd backend
   source .venv/bin/activate
   uvicorn app.main:app --reload --port 8000
   ```

2. In another terminal, make the script executable and launch it:
   ```bash
   chmod +x shell/smartspend.sh
   ./shell/smartspend.sh
   ```

*(Optional)* If your backend is hosted on another host or port, configure the API URL:
```bash
API_URL="http://127.0.0.1:8000/api" ./shell/smartspend.sh
```

### CLI Menu Flow

```text
Application Start → Main Menu → Login / Exit
            Login → Admin Dashboard or User Dashboard
```

- The CLI always starts at Main Menu; a previously saved token does not bypass explicit login.
- The Admin Dashboard provides user listing, user creation with user/admin role selection, user removal, and Exit.
- The User Dashboard provides transaction listing, income/expense creation, financial summary, transaction deletion, and Exit.
- Income and expense use category picklists, optional descriptions, today's date by default, and a confirmation step before `POST /api/transactions`.
- Transaction listing and deletion use the authenticated user's transactions; ownership is enforced by the backend.
- ANSI colors are disabled when output is redirected or `NO_COLOR` is set.

---

## 🚀 Running the Web Application Locally

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

### Backend Automated Tests
```powershell
# Windows PowerShell
$env:PYTHONPATH='backend'; .\backend\.venv\Scripts\python.exe backend/test_api.py
$env:PYTHONPATH='backend'; .\backend\.venv\Scripts\python.exe backend/test_live_supabase.py
```

### Frontend Production Build
```powershell
cd frontend
npm run build
```

### Bash CLI Verification
```bash
# Ubuntu Linux
./shell/smartspend.sh
```
