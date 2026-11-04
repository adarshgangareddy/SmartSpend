import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Search for .env in backend directory or current working directory
env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


def verify_connection() -> bool:
    """Verify Supabase database connectivity and transactions table accessibility."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        print("[ERROR] Missing environment variables!")
        print("Please make sure SUPABASE_URL and SUPABASE_KEY are defined in backend/.env")
        print("Refer to backend/.env.example for required variables.")
        return False

    if "your-project-id" in supabase_url or "your-supabase" in supabase_key:
        print("[ERROR] Placeholder credentials detected in backend/.env!")
        print("Please replace placeholders with your actual Supabase URL and anon key.")
        return False

    try:
        from supabase import create_client, Client
    except ImportError as exc:
        print(f"[ERROR] Required package missing: {exc}")
        print("Please install dependencies: pip install -r requirements.txt")
        return False

    print("[INFO] Connecting to Supabase...")
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        # Test query to transactions table
        response = supabase.table("transactions").select("id").limit(1).execute()
        print("[SUCCESS] Successfully connected to Supabase and verified 'transactions' table access!")
        print(f"[INFO] Response received successfully (row count query returned {len(response.data)} records).")
        return True
    except Exception as exc:
        print("[FAILURE] Failed to connect or query the 'transactions' table.")
        print(f"[REASON] {exc}")
        print("\nTroubleshooting Checklist:")
        print("1. Have you run the table creation SQL script in your Supabase SQL Editor?")
        print("2. Is your SUPABASE_URL formatted as 'https://<project-ref>.supabase.co'?")
        print("3. Are you using the 'anon' public API key?")
        return False


if __name__ == "__main__":
    is_successful = verify_connection()
    sys.exit(0 if is_successful else 1)

