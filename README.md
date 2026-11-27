# SmartSpend — Personal Finance & Smart Expense Tracker

SmartSpend is a full-stack personal finance management application built with **React**, **TypeScript**, **FastAPI**, and **Supabase (PostgreSQL)**. It combines real-time expense tracking, multi-currency analytics, secure authentication, and a **Smart Planner** for managing upcoming purchases and converting them into logged expenses.

---

## Key Features

- **Authentication & Account Security**
  - Email/password registration and login, plus **Google OAuth** sign-in with `/auth/callback` handling.
  - Email verification, password reset, and verified password-change flows powered by Supabase Auth and transactional HTML email templates (`supabase/email_templates/`) via Brevo SMTP/API.
  - Server-side JWT bearer token validation (`HTTPBearer`) on all protected API endpoints so every query is strictly scoped to the authenticated user.
- **Interactive Financial Dashboard & Analytics**
  - Real-time KPI summary cards (**Total Income**, **Total Expenses**, **Net Balance**) with monthly filtering and instant cached hydration for fast initial load.
  - Interactive data visualizations powered by **Recharts** (Income vs. Expenses comparison and Category Breakdown).
- **Transaction Management**
  - Full CRUD for `income` and `expense` records with category tagging, date selection, currency support, search, filtering, and pagination.
- **Smart Planner**
  - Plan and track upcoming purchases categorized by urgency (`immediate`, `upcoming`, `long_term`), custom event tags, target dates, and estimated amounts.
  - **One-Click Convert**: Convert any planned item directly into a logged expense transaction while automatically marking the planned item as `bought`.
- **Multi-Currency Conversion**
  - Supports **12 currencies** (`INR`, `USD`, `EUR`, `GBP`, `JPY`, `AUD`, `CAD`, `SGD`, `AED`, `CNY`, `KRW`, `CHF`) with a 3-tier exchange rate cache (in-memory, local JSON disk cache, and Supabase `exchange_rates` table).
- **Profile, Preferences & Responsive UI**
  - Customizable preferred currency, date format, budget threshold alerts, data export, and full account deletion.
  - Responsive layout featuring a desktop sidebar, mobile bottom navigation, and a dedicated product landing page.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS 3, Recharts 3, Lucide React, `@supabase/supabase-js` |
| **Backend** | Python, FastAPI, Uvicorn, Pydantic v2, PyJWT, `python-dotenv` |
| **Database & Auth** | Supabase (PostgreSQL + Auth), Supabase Python SDK |
| **Email Delivery** | Brevo (SMTP / HTTP API) with custom HTML templates |
| **Deployment** | Vercel (Frontend SPA + `/api/*` rewrites) & Render (FastAPI Backend) |

---

## Project Structure

```text
SmartSpend/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── analytics.py          # /api/analytics/summary & /api/analytics/rates
│   │   │   ├── auth.py               # /api/auth/* (signup, login, OAuth, password flows)
│   │   │   ├── planner.py            # /api/planner/* (CRUD + convert to expense)
│   │   │   ├── profile.py            # /api/profile (get, update, delete account)
│   │   │   └── transactions.py       # /api/transactions/* (CRUD + filters)
│   │   ├── schemas/                  # Pydantic v2 request/response models
│   │   │   ├── planner.py
│   │   │   ├── profile.py
│   │   │   └── transaction.py
│   │   ├── services/                 # Business logic & external integrations
│   │   │   ├── currency_service.py   # Multi-tier exchange rate caching & conversion
│   │   │   ├── email_service.py      # Brevo transactional email dispatching
│   │   │   ├── profile_service.py
│   │   │   └── transaction_service.py
│   │   ├── auth.py                   # JWT bearer verification dependency
│   │   ├── config.py                 # Environment configuration & CORS settings
│   │   ├── database.py               # Supabase client & admin client management
│   │   └── main.py                   # FastAPI app entrypoint & router registration
│   ├── migrations/                   # Incremental SQL migrations (001–004)
│   ├── requirements.txt
│   ├── seed_data.py
│   ├── test_api.py                   # Unit tests with mocked Supabase client
│   ├── test_auth_and_google.py       # Auth & Google OAuth endpoint tests
│   ├── test_live_supabase.py         # Live Supabase integration tests
│   ├── test_synchronization.py       # Data synchronization tests
│   ├── verify_db.py                  # Database connectivity check
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/               # Dashboard, PlannerPage, TransactionsPage, SettingsPage, AuthModal, etc.
│   │   ├── services/
│   │   │   ├── api.ts                # Typed REST API client
│   │   │   └── auth.ts               # Auth session & OAuth helpers
│   │   ├── types/index.ts            # Shared TypeScript interfaces
│   │   ├── utils/formatters.ts       # Currency & date formatting utilities
│   │   ├── App.tsx                   # Root application state & routing
│   │   └── main.tsx                  # React DOM entrypoint
│   ├── package.json
│   ├── vercel.json                   # Vercel SPA & /api/* rewrite configuration
│   ├── vite.config.ts                # Vite config with /api & /health dev proxy
│   └── .env.example
├── docs/
│   └── schema.sql                    # Base PostgreSQL schema for transactions & planned_items
└── supabase/
    └── email_templates/              # HTML templates for signup, reset, and email/password changes
```

---

## Local Development Setup

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** and **npm**
- A **Supabase** project (URL, anon/public key, and service role key)

### 1. Database Setup
Run the SQL schema in your Supabase SQL Editor:
1. Execute [`docs/schema.sql`](docs/schema.sql) to create `transactions` and `planned_items` tables and indexes.
2. Apply the incremental scripts in [`backend/migrations/`](backend/migrations/) (`001_auth_and_profiles.sql` through `004_user_roles.sql`) for user profiles, preferences, and exchange rate storage.

### 2. Backend Setup (Port 8000)

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:
- **Linux / macOS:** `source .venv/bin/activate`
- **Windows (PowerShell):** `.\.venv\Scripts\Activate.ps1`

Install dependencies and configure environment variables:
```bash
pip install -r requirements.txt
cp .env.example .env
```

Populate `backend/.env` with your credentials:
- `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_URL` (e.g., `http://localhost:5173`)
- `ALLOWED_ORIGINS` (e.g., `http://localhost:5173,http://127.0.0.1:5173`)
- Optional Brevo SMTP settings (`BREVO_SMTP_HOST`, `BREVO_SMTP_PORT`, `BREVO_SMTP_USER`, `BREVO_SMTP_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`)

Start the FastAPI server:
```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup (Port 5173)

In a separate terminal:
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open the application:
- **Web App:** `http://localhost:5173`
- **Interactive API Docs (Swagger UI):** `http://127.0.0.1:8000/docs`
- **ReDoc:** `http://127.0.0.1:8000/redoc`

---

## API Reference

All API routes are mounted under `/api` (with `/health` also available at root). Protected routes require an `Authorization: Bearer <token>` header.

### General & Health
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Service metadata & endpoint directory | Public |
| `GET` | `/health`, `/api/health` | Service health check | Public |

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register a new user account | Public |
| `POST` | `/api/auth/login` | Authenticate with email & password | Public |
| `GET` | `/api/auth/me` | Validate token & return current user identity | Bearer |
| `GET` | `/api/auth/oauth/google` | Generate Google OAuth authorization URL | Public |
| `POST` | `/api/auth/exchange-code` | Exchange OAuth authorization code for session | Public |
| `POST` | `/api/auth/reset-password` | Send password recovery email | Public |
| `POST` | `/api/auth/resend-verification` | Resend account verification email | Public |
| `POST` | `/api/auth/request-password-change` | Initiate email-verified password change | Bearer |
| `POST` | `/api/auth/confirm-password-change` | Confirm password change with token | Public |
| `POST` | `/api/auth/update-password` | Update password for authenticated/recovery session | Bearer |

### Transactions (`/api/transactions`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/transactions` | Create a new income or expense record | Bearer |
| `GET` | `/api/transactions` | List transactions (filter by `type`, `category`, dates, pagination) | Bearer |
| `GET` | `/api/transactions/{transaction_id}` | Retrieve a single transaction by ID | Bearer |
| `PUT` | `/api/transactions/{transaction_id}` | Update an existing transaction | Bearer |
| `DELETE` | `/api/transactions/{transaction_id}` | Delete a transaction | Bearer |

### Analytics (`/api/analytics`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/analytics/summary` | Calculate total income, expenses, and net balance | Bearer |
| `GET` | `/api/analytics/rates` | Retrieve cached exchange rates against USD | Public / Bearer |

### Smart Planner (`/api/planner`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/planner` | List planned items (filter by status, urgency, event) | Bearer |
| `POST` | `/api/planner` | Create a new planned purchase item | Bearer |
| `PUT` | `/api/planner/{item_id}` | Update a planned purchase item | Bearer |
| `DELETE` | `/api/planner/{item_id}` | Delete a planned purchase item | Bearer |
| `POST` | `/api/planner/{item_id}/convert` | Mark item as `bought` and create an expense transaction | Bearer |

### Profile (`/api/profile`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/profile` | Retrieve authenticated user's profile & preferences | Bearer |
| `PUT` | `/api/profile` | Update display name or preferred currency | Bearer |
| `DELETE` | `/api/profile` | Permanently delete account and all associated data | Bearer |

---

## Testing & Verification

### Backend Tests
Run unit tests from the `backend/` directory (with the virtual environment activated):
```bash
PYTHONPATH=. python test_api.py
PYTHONPATH=. python test_auth_and_google.py
```

### Frontend Type Check & Production Build
```bash
cd frontend
npm run build
```

---

## Deployment

- **Frontend (Vercel):** Configured via [`frontend/vercel.json`](frontend/vercel.json) to proxy `/api/*` requests to the deployed FastAPI backend and rewrite client routes to `/index.html`. Set `VITE_API_URL` and `VITE_SUPABASE_URL` in Vercel environment settings.
- **Backend (Render / ASGI):** Run `uvicorn app.main:app --host 0.0.0.0 --port $PORT` with production environment variables configured for Supabase, CORS (`ALLOWED_ORIGINS`), `FRONTEND_URL`, and Brevo email delivery.
