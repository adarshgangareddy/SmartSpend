"""
SmartSpend Phase 5: Cross-Platform Synchronization & Integration Test Suite
Validates bidirectional data flow between the Web API and the Bash CLI
against the live Supabase PostgreSQL database.
"""

import json
import subprocess
import sys
import unittest
from datetime import date
from decimal import Decimal
import requests

API_BASE = "http://127.0.0.1:8000/api"
BASH_PATH = r"C:\Program Files\Git\bin\bash.exe"


class TestCrossPlatformSynchronization(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Verify backend is running
        try:
            r = requests.get(f"{API_BASE.rsplit('/api', 1)[0]}/health", timeout=3)
            if r.status_code != 200 or r.json().get("status") != "healthy":
                raise RuntimeError("FastAPI server is not healthy.")
        except Exception as e:
            raise RuntimeError(f"Cannot connect to FastAPI server at {API_BASE}: {e}")

    def run_bash_function(self, bash_commands: str) -> str:
        """Run a bash snippet using Git Bash with PATH pointing to jq."""
        cmd = [
            BASH_PATH,
            "-c",
            f'export PATH="$PATH:./backend/.venv/Scripts"; {bash_commands}',
        ]
        res = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=10,
        )
        if res.returncode != 0:
            raise RuntimeError(f"Bash command failed ({res.returncode}): {res.stderr}\nOutput: {res.stdout}")
        return res.stdout

    def test_01_web_to_cli_sync(self):
        """Test A: Add an expense in Web API -> Verify it appears in Bash CLI."""
        payload = {
            "type": "expense",
            "amount": 850.50,
            "category": "SyncWeb2CLI",
            "description": "Created from Web Simulation",
            "currency": "INR",
            "transaction_date": "2026-11-04",
        }
        # 1. Web adds expense
        res = requests.post(f"{API_BASE}/transactions", json=payload)
        self.assertEqual(res.status_code, 201, f"Failed to create via API: {res.text}")
        created_tx = res.json()
        tx_id = created_tx["id"]

        try:
            # 2. Verify directly in Supabase via API
            verify_res = requests.get(f"{API_BASE}/transactions/{tx_id}")
            self.assertEqual(verify_res.status_code, 200)

            # 3. Fetch transactions in Bash CLI and verify appearance
            cli_output = self.run_bash_function("source shell/smartspend.sh; view_transactions")
            self.assertIn(str(tx_id), cli_output, "Transaction ID not found in CLI output")
            self.assertIn("SyncWeb2CLI", cli_output, "Category not found in CLI output")
            self.assertIn("-INR 850.5", cli_output, "Expense amount not found in CLI output")
        finally:
            # Clean up
            requests.delete(f"{API_BASE}/transactions/{tx_id}")

    def test_02_cli_to_web_sync(self):
        """Test B: Add income using Bash CLI -> Verify it appears in Web API."""
        # Execute add_transaction in Bash CLI via input pipe
        cli_input = (
            "14500.00\n"        # Amount
            "SyncCLI2Web\n"     # Category
            "Income via CLI\n"  # Description
            "INR\n"             # Currency
            "2026-11-04\n"      # Date
        )
        bash_cmd = f'source shell/smartspend.sh; printf "{cli_input}" | add_transaction "income"'
        cli_output = self.run_bash_function(bash_cmd)
        self.assertIn("created successfully", cli_output)

        created_id = None
        for word in cli_output.split():
            if word.startswith("#"):
                created_id = int(word.replace("#", ""))
                break

        self.assertIsNotNone(created_id, f"Could not parse ID from CLI output: {cli_output}")

        try:
            # Verify Web API returns the transaction created via CLI
            web_res = requests.get(f"{API_BASE}/transactions/{created_id}")
            self.assertEqual(web_res.status_code, 200)
            web_data = web_res.json()
            self.assertEqual(web_data["type"], "income")
            self.assertEqual(web_data["category"], "SyncCLI2Web")
            self.assertEqual(web_data["amount"], 14500.0)

            # Verify presence in full transaction list (as used by React transactions page)
            all_res = requests.get(f"{API_BASE}/transactions")
            ids = [t["id"] for t in all_res.json()]
            self.assertIn(created_id, ids)
        finally:
            # Clean up
            requests.delete(f"{API_BASE}/transactions/{created_id}")

    def test_03_delete_sync(self):
        """Test C: Delete Synchronization between Web and CLI."""
        # 1. Create a transaction to delete via Web
        res1 = requests.post(f"{API_BASE}/transactions", json={
            "type": "expense",
            "amount": 333.00,
            "category": "DelWebSync",
            "currency": "INR",
            "transaction_date": "2026-11-04"
        })
        id1 = res1.json()["id"]

        # Delete via Web API
        del_res = requests.delete(f"{API_BASE}/transactions/{id1}")
        self.assertEqual(del_res.status_code, 200)

        # Confirm CLI no longer lists id1
        cli_out1 = self.run_bash_function("source shell/smartspend.sh; view_transactions")
        self.assertNotIn("DelWebSync", cli_out1)

        # 2. Create another transaction to delete via CLI
        res2 = requests.post(f"{API_BASE}/transactions", json={
            "type": "income",
            "amount": 777.00,
            "category": "DelCLISync",
            "currency": "INR",
            "transaction_date": "2026-11-04"
        })
        id2 = res2.json()["id"]

        # Delete via CLI
        del_input = f"{id2}\ny\n"
        bash_cmd = f'source shell/smartspend.sh; printf "{del_input}" | delete_transaction'
        cli_out2 = self.run_bash_function(bash_cmd)
        self.assertIn(f"Transaction #{id2} deleted successfully", cli_out2)

        # Confirm Web API returns 404 for id2
        web_check = requests.get(f"{API_BASE}/transactions/{id2}")
        self.assertEqual(web_check.status_code, 404)

    def test_04_update_sync(self):
        """Test D: Edit a transaction on Web -> Verify updated data reflects in CLI."""
        # 1. Create initial transaction
        create_res = requests.post(f"{API_BASE}/transactions", json={
            "type": "expense",
            "amount": 500.00,
            "category": "InitialCat",
            "description": "Original Note",
            "currency": "INR",
            "transaction_date": "2026-11-04"
        })
        tx_id = create_res.json()["id"]

        try:
            # 2. Edit via Web API
            update_res = requests.put(f"{API_BASE}/transactions/{tx_id}", json={
                "amount": 925.00,
                "description": "Updated by Web App",
            })
            self.assertEqual(update_res.status_code, 200)

            # 3. Verify in CLI
            cli_out = self.run_bash_function("source shell/smartspend.sh; view_transactions")
            self.assertIn("925.0", cli_out)
            self.assertIn("Updated by Web App", cli_out)
        finally:
            requests.delete(f"{API_BASE}/transactions/{tx_id}")

    def test_05_currency_isolation_and_math(self):
        """Test E: Financial Summary Math & Multi-Currency Isolation."""
        # Summary for INR
        summary_inr = requests.get(f"{API_BASE}/analytics/summary?currency=INR").json()
        inc = Decimal(str(summary_inr["total_income"]))
        exp = Decimal(str(summary_inr["total_expenses"]))
        bal = Decimal(str(summary_inr["balance"]))
        self.assertEqual(bal, inc - exp, "Balance must strictly equal Income minus Expenses")

        # Insert a transaction in a different currency (USD)
        usd_tx = requests.post(f"{API_BASE}/transactions", json={
            "type": "expense",
            "amount": 99.00,
            "category": "USDCurrencyTest",
            "currency": "USD",
            "transaction_date": "2026-11-04"
        }).json()
        usd_id = usd_tx["id"]

        try:
            # Verify INR summary did not change / was not contaminated with USD
            summary_inr_after = requests.get(f"{API_BASE}/analytics/summary?currency=INR").json()
            self.assertEqual(
                Decimal(str(summary_inr_after["total_expenses"])),
                exp,
                "INR summary must not include USD transactions",
            )

            # Verify USD summary reflects USD transaction
            summary_usd = requests.get(f"{API_BASE}/analytics/summary?currency=USD").json()
            self.assertEqual(summary_usd["currency"], "USD")
            self.assertGreaterEqual(summary_usd["total_expenses"], 99.0)
        finally:
            requests.delete(f"{API_BASE}/transactions/{usd_id}")


if __name__ == "__main__":
    unittest.main()

