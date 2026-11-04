# SmartSpend — Smart Personal Expense Tracker

A modern personal finance and expense tracking web application engineered for simplicity, reliability, and cross-platform flexibility (Windows and Ubuntu Linux).

---

## 🛠️ Technology Stack

- **Frontend:** React + Vite + TypeScript (configured in future phases)
- **Backend:** Python 3.14 + FastAPI + Uvicorn
- **Database:** Supabase (Cloud PostgreSQL)
- **Authentication:** Supabase Auth (OAuth integration in subsequent phase)
- **Scripting:** Unix Shell / Bash (tested on Ubuntu Linux)
- **API Architecture:** RESTful JSON API

---

## 📁 Project Directory Structure

```text
smartspend/
├── frontend/               # React + Vite + TypeScript frontend
├── backend/                # FastAPI backend service
│   ├── app/
│   │   ├── __init__.py     # Python package marker
│   │   └── main.py         # FastAPI application entrypoint & health check
│   ├── requirements.txt    # Frozen Python dependencies
│   ├── verify_db.py        # Database connectivity verification script
│   ├── .env.example        # Environment variable template
│   └── .gitignore          # Backend-specific ignore rules
├── shell/                  # Unix Bash automation & batch scripts (Ubuntu)
├── docs/                   # Project documentation & database schemas
│   └── schema.sql          # Phase 1 PostgreSQL schema for Supabase
├── assets/                 # Project branding, logos, and UI mockups
│   ├── logo.jpg
│   └── dashboard_reference.jpg
├── .gitignore              # Root Git ignore rules
└── README.md               # Project guide and documentation
```

---

## 📋 Development Prerequisites

- **Python:** Python 3.10+ (tested with Python 3.14)
- **Git:** Installed on both Windows and Ubuntu
- **Supabase Account:** Free tier at [https://supabase.com](https://supabase.com)
- **Dual-boot setup note:**
  - Web application and backend can be run on **Windows** using PowerShell.
  - Shell scripts and Linux utilities are run on **Ubuntu Linux** using Bash.

---

## ⚙️ Backend Setup Instructions

### 1. Windows (PowerShell)

Navigate to the backend directory and set up the virtual environment:

```powershell
# Navigate to backend
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install required dependencies
pip install -r requirements.txt
```

> **Note for PowerShell execution policy:** If script execution is restricted on Windows, run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` before activating.

### 2. Ubuntu Linux (Bash)

Navigate to the project directory and set up Python:

```bash
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Install required dependencies
pip install -r requirements.txt
```

---

## 🔑 Environment Configuration

1. In the `backend/` directory, create a `.env` file copied from `.env.example`:

   **Windows (PowerShell):**
   ```powershell
   Copy-Item .env.example .env
   ```

   **Ubuntu (Bash):**
   ```bash
   cp .env.example .env
   ```

2. Open `backend/.env` and fill in your Supabase credentials:
   ```env
   SUPABASE_URL=https://<your-project-id>.supabase.co
   SUPABASE_KEY=<your-anon-public-key>
   ```

> ⚠️ **Security Warning:**
> - Use the **`anon` (public)** key for this client connection.
> - **NEVER** expose or commit the `service_role` (secret) key.
> - Keep `.env` strictly untracked by Git (already configured in `.gitignore`).

---

## 🗄️ Supabase Database Setup

1. Log in to [Supabase](https://supabase.com) and click **New project**.
2. Set a **Project Name** (e.g., `smartspend-dev`) and database password. Choose the closest region.
3. Once the database is provisioned, go to the **SQL Editor** (icon on the left sidebar).
4. Click **New query**, paste the contents of [`docs/schema.sql`](docs/schema.sql), and click **Run**.
5. Obtain your credentials:
   - Go to **Project Settings** (gear icon) -> **API**.
   - Copy **Project URL** and paste as `SUPABASE_URL` in `backend/.env`.
   - Copy **Project API Keys (`anon` `public`)** and paste as `SUPABASE_KEY` in `backend/.env`.

---

## 🚀 How to Run FastAPI Locally

From the `backend/` directory with the virtual environment activated:

```bash
# Start uvicorn server on port 8000 with auto-reload
uvicorn app.main:app --reload --port 8000
```

Open your browser or terminal to check the health endpoint:
- **URL:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- **Interactive OpenAPI Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

Expected health response:
```json
{
  "status": "healthy",
  "application": "SmartSpend"
}
```

---

## 🧪 How to Verify Database Connection

After setting your credentials in `backend/.env`, run the verification script:

**Windows (PowerShell):**
```powershell
python verify_db.py
```

**Ubuntu (Bash):**
```bash
python3 verify_db.py
```

Expected output upon successful connection:
```text
[INFO] Connecting to Supabase...
[SUCCESS] Successfully connected to Supabase and verified 'transactions' table access!
[INFO] Response received successfully (row count query returned 0 records).
```
