"""Seed 10 sample transactions into Supabase PostgreSQL."""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment
base_dir = Path(__file__).resolve().parent
env_path = base_dir / ".env"
load_dotenv(dotenv_path=env_path)

from app.database import get_supabase_client

records = [
    {
        "type": "income",
        "amount": 65000.00,
        "category": "Salary",
        "description": "Monthly Software Engineer Salary",
        "currency": "INR",
        "transaction_date": "2026-11-01",
    },
    {
        "type": "income",
        "amount": 15000.00,
        "category": "Freelance",
        "description": "Web Design Consulting",
        "currency": "INR",
        "transaction_date": "2026-11-02",
    },
    {
        "type": "income",
        "amount": 3200.00,
        "category": "Investment",
        "description": "Quarterly Stock Dividend",
        "currency": "INR",
        "transaction_date": "2026-11-03",
    },
    {
        "type": "expense",
        "amount": 18000.00,
        "category": "Rent",
        "description": "Monthly Apartment Rent",
        "currency": "INR",
        "transaction_date": "2026-11-01",
    },
    {
        "type": "expense",
        "amount": 4250.50,
        "category": "Groceries",
        "description": "Supermarket Monthly Groceries",
        "currency": "INR",
        "transaction_date": "2026-11-02",
    },
    {
        "type": "expense",
        "amount": 2800.00,
        "category": "Utilities",
        "description": "Electricity & Fiber Internet",
        "currency": "INR",
        "transaction_date": "2026-11-02",
    },
    {
        "type": "expense",
        "amount": 1350.00,
        "category": "Food",
        "description": "Dinner with Friends at Bistro",
        "currency": "INR",
        "transaction_date": "2026-11-03",
    },
    {
        "type": "expense",
        "amount": 950.00,
        "category": "Transit",
        "description": "Metro SmartCard & Fuel",
        "currency": "INR",
        "transaction_date": "2026-11-03",
    },
    {
        "type": "expense",
        "amount": 1199.00,
        "category": "Entertainment",
        "description": "Streaming Subscriptions",
        "currency": "INR",
        "transaction_date": "2026-11-04",
    },
    {
        "type": "expense",
        "amount": 3499.00,
        "category": "Shopping",
        "description": "Ergonomic Desk Accessories",
        "currency": "INR",
        "transaction_date": "2026-11-04",
    },
]

def seed():
    client = get_supabase_client()
    res = client.table("transactions").insert(records).execute()
    print(f"Successfully inserted {len(res.data)} records into Supabase!")
    for r in res.data:
        tx_type = r.get("type", "").upper()
        amt = r.get("amount", 0)
        cat = r.get("category", "")
        desc = r.get("description", "")
        tx_id = r.get("id")
        print(f"  [ID {tx_id:2d}] {tx_type:7s} | INR {amt:10.2f} | {cat:13s} | {desc}")

if __name__ == "__main__":
    seed()

